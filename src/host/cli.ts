import { execFile, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

export function runClaude(bin: string, args: string[], cwd: string, timeout: number, input = "") {
	const shell = /\.(cmd|bat)$/i.test(bin);
	if (shell && args.some((a) => /["%\r\n]/.test(a)))
		throw new Error("Unsupported characters in claude arguments");
	const child = shell
		? spawn(
				`"${bin}"`,
				args.map((a) => `"${a}"`),
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
		}, timeout);
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
			if (code !== 0) reject(new Error((err || out).trim() || `claude exited with code ${code}`));
			else resolve(out);
		});
		child.stdin.end(input, "utf8");
	});
}

export async function findClaude(custom: string) {
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
