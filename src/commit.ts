import { execFile, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import * as vscode from "vscode";
import { notify } from "./notify";
import { COMMIT_MODELS, type CommitModel, type CommitSettings, EFFORTS } from "./shared";

interface Repo {
	rootUri: vscode.Uri;
	inputBox: { value: string };
}
interface GitExtension {
	getAPI(version: 1): { repositories: Repo[] };
}

const LIMIT = 100_000;
const TIMEOUT = 120_000;
const run = promisify(execFile);

export function registerCommit(ctx: vscode.ExtensionContext): void {
	ctx.subscriptions.push(
		vscode.commands.registerCommand("claudeHelper.generateCommit", async (scm?: { rootUri?: vscode.Uri }) => {
			try {
				const repo = await pickRepo(scm?.rootUri);
				if (!repo) return;
				const root = repo.rootUri.fsPath;
				const settings = commitSettings();
				const diff = await collectDiff(root, settings.untracked);
				if (!diff) {
					vscode.window.showInformationMessage("No changes to describe");
					return;
				}
				const message = await vscode.window.withProgress(
					{ location: vscode.ProgressLocation.SourceControl, title: "Generating commit message" },
					async () =>
						askClaude(
							await findClaude(settings.claudePath),
							settings.model,
							settings.effort,
							root,
							`${settings.prompt}\n\nWrite a git commit message for the diff below. Reply with the commit message only: no preamble, no quotes, no code fences.\n\n${diff}`,
						),
				);
				repo.inputBox.value = message;
				notify("commit");
			} catch (e) {
				const message = e instanceof Error ? e.message : String(e);
				console.warn("Claude Helper: commit generation failed", e);
				vscode.window.showErrorMessage(`Claude Helper: ${message}`);
			}
		}),
	);
}

export function commitSettings(): CommitSettings {
	const c = vscode.workspace.getConfiguration("claudeHelper");
	const model = c.get<string>("commit.model", "haiku");
	const effort = c.get<string>("commit.effort", "");
	return {
		prompt: c.get<string>("commit.prompt", ""),
		model: COMMIT_MODELS.includes(model as CommitModel) ? (model as CommitModel) : "haiku",
		effort: EFFORTS.includes(effort) ? effort : "",
		claudePath: c.get<string>("commit.claudePath", ""),
		untracked: c.get<boolean>("commit.untracked", false),
	};
}

export const commitApi = {
	async setCommit(patch: Partial<CommitSettings>) {
		const c = vscode.workspace.getConfiguration("claudeHelper");
		for (const [key, value] of Object.entries(patch)) await c.update(`commit.${key}`, value, true);
		return true;
	},
};

async function pickRepo(root?: vscode.Uri): Promise<Repo | undefined> {
	const ext = vscode.extensions.getExtension<GitExtension>("vscode.git");
	if (!ext) throw new Error("Git extension is not available");
	const repos = (ext.isActive ? ext.exports : await ext.activate()).getAPI(1).repositories;
	const match = root && repos.find((r) => r.rootUri.fsPath === root.fsPath);
	if (match) return match;
	if (repos.length === 1) return repos[0];
	if (!repos.length) throw new Error("No Git repository found");
	const picked = await vscode.window.showQuickPick(
		repos.map((r) => r.rootUri.fsPath),
		{ placeHolder: "Select a repository" },
	);
	return repos.find((r) => r.rootUri.fsPath === picked);
}

async function collectDiff(root: string, untracked: boolean) {
	const git = async (...args: string[]) =>
		(await run("git", args, { cwd: root, maxBuffer: 64 * 1024 * 1024 })).stdout;
	let diff = await git("diff", "--cached");
	if (!diff.trim()) {
		diff = await git("diff");
		if (untracked) {
			for (const file of (await git("ls-files", "--others", "--exclude-standard", "-z")).split("\0")) {
				if (diff.length > LIMIT) break;
				if (!file) continue;
				const path = join(root, file);
				if ((await stat(path).catch(() => ({ size: Number.POSITIVE_INFINITY }))).size > LIMIT) continue;
				const text = await readFile(path, "utf8").catch(() => "\0");
				if (!text.includes("\0")) diff += `\nNew file: ${file}\n${text}\n`;
			}
		}
	}
	if (!diff.trim()) return "";
	return diff.length > LIMIT ? `${diff.slice(0, LIMIT)}\n[diff truncated]` : diff;
}

function askClaude(bin: string, model: CommitModel, effort: string, cwd: string, prompt: string) {
	const args = [
		"-p",
		"--model",
		model,
		...(effort ? ["--effort", effort] : []),
		"--tools",
		"",
		"--strict-mcp-config",
		"--no-session-persistence",
		"--settings",
		'{"disableAllHooks":true}',
	];
	const shell = /\.(cmd|bat)$/i.test(bin);
	const child = shell
		? spawn(
				`"${bin}"`,
				args.map((a) => `"${a.replace(/"/g, '\\"')}"`),
				{ cwd, shell, windowsHide: true },
			)
		: spawn(bin, args, { cwd, windowsHide: true });
	return new Promise<string>((resolve, reject) => {
		let out = "";
		let err = "";
		const timer = setTimeout(() => {
			if (process.platform === "win32")
				execFile("taskkill", ["/pid", String(child.pid), "/T", "/F"], { windowsHide: true }, () => {});
			else child.kill();
			reject(new Error("claude timed out"));
		}, TIMEOUT);
		child.stdout.setEncoding("utf8");
		child.stderr.setEncoding("utf8");
		child.stdout.on("data", (d: string) => {
			out += d;
		});
		child.stderr.on("data", (d: string) => {
			err += d;
		});
		child.stdin.on("error", (e) => console.warn("Claude Helper: claude stdin", e));
		child.on("error", (e) => {
			clearTimeout(timer);
			reject(e);
		});
		child.on("close", (code) => {
			clearTimeout(timer);
			if (code !== 0) return reject(new Error((err || out).trim() || `claude exited with code ${code}`));
			const text = out
				.trim()
				.replace(/^```[^\n]*\n([\s\S]*?)\n?```$/, "$1")
				.trim();
			if (text) resolve(text);
			else reject(new Error("claude returned an empty message"));
		});
		child.stdin.end(prompt, "utf8");
	});
}

async function findClaude(custom: string) {
	const home = homedir();
	const own = custom.trim().replace(/^~(?=$|[\\/])/, home);
	if (own && existsSync(own)) return own;
	const win = process.platform === "win32";
	const found = (await run(win ? "where" : "which", ["claude"]).catch(() => ({ stdout: "" }))).stdout
		.split(/\r?\n/)
		.map((l) => l.trim())
		.filter(Boolean);
	const pick = win
		? (found.find((l) => /\.exe$/i.test(l)) ?? found.find((l) => /\.cmd$/i.test(l)))
		: found[0];
	if (pick) return pick;
	if (!win) {
		const login = (
			await run(process.env.SHELL || "/bin/sh", ["-lc", "command -v claude"]).catch(() => ({ stdout: "" }))
		).stdout.trim();
		if (login && existsSync(login)) return login;
	}
	const known = [
		join(home, ".local", "bin", win ? "claude.exe" : "claude"),
		join(process.env.APPDATA ?? join(home, "AppData", "Roaming"), "npm", "claude.cmd"),
		"/opt/homebrew/bin/claude",
		"/usr/local/bin/claude",
		join(home, ".claude", "local", "claude"),
	].find((p) => existsSync(p));
	if (known) return known;
	throw new Error("Claude CLI not found. Set its path in Claude Helper → Commits");
}
