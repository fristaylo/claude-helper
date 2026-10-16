import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import * as vscode from "vscode";
import type { Scope } from "../shared";

export function configDir() {
	const custom = setting();
	if (custom) return custom.replace(/^~(?=$|[\\/])/, homedir());
	return process.env.CLAUDE_CONFIG_DIR || join(homedir(), ".claude");
}

export const isCustomDir = () => !!setting();

export function workspaceDir() {
	return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? null;
}

export function scopeDir(scope: Scope) {
	if (scope === "global") return configDir();
	const workspace = workspaceDir();
	if (!workspace) throw new Error("Open a folder to edit project settings");
	return join(workspace, ".claude");
}

export function settingsName(scope: Scope) {
	return scope === "global" ? "settings.json" : "settings.local.json";
}

export const pathsApi = { pickDir, resetDir, reveal };

function setting() {
	return vscode.workspace.getConfiguration("claudeHelper").get<string>("configDir")?.trim() ?? "";
}

async function pickDir() {
	const [dir] =
		(await vscode.window.showOpenDialog({
			canSelectFolders: true,
			canSelectFiles: false,
			defaultUri: vscode.Uri.file(configDir()),
			openLabel: "Use as Claude folder",
		})) ?? [];
	if (dir) await vscode.workspace.getConfiguration("claudeHelper").update("configDir", dir.fsPath, true);
}

async function resetDir() {
	await vscode.workspace.getConfiguration("claudeHelper").update("configDir", undefined, true);
}

async function reveal(scope: Scope) {
	const dir = scopeDir(scope);
	await mkdir(dir, { recursive: true });
	await vscode.commands.executeCommand("revealFileInOS", vscode.Uri.file(dir));
}
