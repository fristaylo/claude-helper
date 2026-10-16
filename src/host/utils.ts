import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as vscode from "vscode";
import type { Scope } from "../shared";
import { scopeDir, settingsName } from "./paths";

export async function readText(file: string) {
	try {
		return (await readFile(file, "utf8")).replace(/^﻿/, "");
	} catch (e: unknown) {
		if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
		throw e;
	}
}

export async function confirm(message: string, action: string, detail?: string) {
	return !!(await vscode.window.showWarningMessage(message, { modal: true, detail }, action));
}

export const utilsApi = { open };

async function open(scope: Scope, rel: string) {
	const parts = rel.split("/");
	const allowed =
		rel === "CLAUDE.md" ||
		rel === settingsName(scope) ||
		(parts[0] === "agents" && parts.length === 2 && rel.endsWith(".md")) ||
		(parts[0] === "skills" && parts.length >= 3);
	if (!allowed || rel.includes("\\") || parts.some((p) => !p || p === "." || p === "..")) {
		throw new Error(`Bad path: ${rel}`);
	}
	const dir = scopeDir(scope);
	const path = join(dir, ...parts);
	if (parts.length === 1 && (await readText(path)) === null) {
		await mkdir(dir, { recursive: true });
		await writeFile(path, rel === "CLAUDE.md" ? "" : "{}\n");
	}
	await vscode.window.showTextDocument(vscode.Uri.file(path), { preview: false });
}
