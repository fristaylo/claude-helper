import { execFile } from "node:child_process";
import { readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import * as vscode from "vscode";
import { findClaude, runClaude } from "../../host/cli";
import { EFFORTS } from "../../shared";
import { notify } from "../notifications/host";
import { COMMIT_MODELS, type CommitModel, type CommitSettings } from "./types";

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

async function askClaude(bin: string, model: CommitModel, effort: string, cwd: string, prompt: string) {
	const settings = join(tmpdir(), "claude-helper-settings.json");
	await writeFile(settings, '{"disableAllHooks":true}');
	const out = await runClaude(
		bin,
		[
			"-p",
			"--model",
			model,
			...(effort ? ["--effort", effort] : []),
			"--tools",
			"",
			"--strict-mcp-config",
			"--no-session-persistence",
			"--settings",
			settings,
		],
		cwd,
		TIMEOUT,
		prompt,
	);
	const text = out
		.trim()
		.replace(/^```[^\n]*\n([\s\S]*?)\n?```$/, "$1")
		.trim();
	if (!text) throw new Error("claude returned an empty message");
	return text;
}
