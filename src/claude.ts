import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, join } from "node:path";
import * as vscode from "vscode";
import { parseAgent, serializeAgent } from "./agent";
import { AGENT_NAME, KINDS, type Meta, type Rules } from "./shared";

const setting = () =>
	vscode.workspace.getConfiguration("claudeAgents").get<string>("configDir")?.trim() ?? "";

export function configDir() {
	const custom = setting();
	if (custom) return custom.replace(/^~(?=$|[\\/])/, homedir());
	return process.env.CLAUDE_CONFIG_DIR || join(homedir(), ".claude");
}

const at = (...parts: string[]) => join(configDir(), ...parts);

async function readText(file: string) {
	try {
		return (await readFile(file, "utf8")).replace(/^\uFEFF/, "");
	} catch (e: any) {
		if (e.code === "ENOENT") return null;
		throw e;
	}
}

async function readSettings(): Promise<Record<string, any>> {
	const text = await readText(at("settings.json"));
	return text?.trim() ? JSON.parse(text) : {};
}

function agentFile(file: string) {
	if (basename(file) !== file || !file.endsWith(".md")) throw new Error(`Bad agent file: ${file}`);
	return at("agents", file);
}

async function load() {
	const files = (await readdir(at("agents")).catch(() => [] as string[])).filter((f) => f.endsWith(".md"));
	const agents = await Promise.all(
		files.map(async (f) => parseAgent(f, (await readText(agentFile(f))) ?? "")),
	);
	let rules: Rules = { deny: [], ask: [], allow: [] };
	let settingsError: string | undefined;
	try {
		const p = (await readSettings()).permissions ?? {};
		rules = Object.fromEntries(KINDS.map((k) => [k, Array.isArray(p[k]) ? p[k].map(String) : []])) as Rules;
	} catch (e: any) {
		settingsError = `settings.json: ${e.message}`;
	}
	return {
		dir: configDir(),
		custom: !!setting(),
		memory: await readText(at("CLAUDE.md")),
		agents: agents.sort((a, b) => a.file.localeCompare(b.file)),
		rules,
		settingsError,
	};
}

async function saveMemory(text: string) {
	await mkdir(configDir(), { recursive: true });
	await writeFile(at("CLAUDE.md"), text);
	return true;
}

async function saveAgent(oldFile: string | null, meta: Meta, prompt: string) {
	const name = String(meta.name ?? "");
	if (!AGENT_NAME.test(name)) throw new Error("Name: lowercase letters, digits and single hyphens only");
	if (!String(meta.description ?? "").trim()) throw new Error("Description is required");
	const file = `${name}.md`;
	await mkdir(at("agents"), { recursive: true });
	if (file.toLowerCase() !== oldFile?.toLowerCase() && (await readText(agentFile(file))) !== null) {
		throw new Error(`Agent "${name}" already exists`);
	}
	if (oldFile && oldFile !== file) await rename(agentFile(oldFile), agentFile(file));
	await writeFile(agentFile(file), serializeAgent(meta, prompt));
	return file;
}

async function deleteAgent(file: string) {
	const path = agentFile(file);
	const pick = await vscode.window.showWarningMessage(
		`Delete agent "${file.replace(/\.md$/, "")}"?`,
		{ modal: true, detail: path },
		"Delete",
	);
	if (!pick) return false;
	await rm(path);
	return true;
}

async function setRules(patch: Partial<Rules>) {
	const settings = await readSettings();
	settings.permissions ??= {};
	for (const k of KINDS) {
		const list = patch[k];
		if (list) settings.permissions[k] = [...new Set(list.map((r) => r.trim()).filter(Boolean))];
	}
	await mkdir(configDir(), { recursive: true });
	await writeFile(at("settings.json"), `${JSON.stringify(settings, null, 2)}\n`);
}

async function open(relPath: string) {
	if (!["CLAUDE.md", "settings.json"].includes(relPath) && !relPath.startsWith("agents/")) {
		throw new Error(`Bad path: ${relPath}`);
	}
	const path = relPath.startsWith("agents/") ? agentFile(relPath.slice(7)) : at(relPath);
	if ((await readText(path)) === null) {
		await mkdir(configDir(), { recursive: true });
		await writeFile(path, relPath === "settings.json" ? "{}\n" : "");
	}
	await vscode.window.showTextDocument(vscode.Uri.file(path), { preview: false });
}

async function reveal() {
	await mkdir(configDir(), { recursive: true });
	await vscode.commands.executeCommand("revealFileInOS", vscode.Uri.file(configDir()));
}

async function pickDir() {
	const [dir] =
		(await vscode.window.showOpenDialog({
			canSelectFolders: true,
			canSelectFiles: false,
			defaultUri: vscode.Uri.file(configDir()),
			openLabel: "Use as Claude folder",
		})) ?? [];
	if (dir) await vscode.workspace.getConfiguration("claudeAgents").update("configDir", dir.fsPath, true);
}

async function resetDir() {
	await vscode.workspace.getConfiguration("claudeAgents").update("configDir", undefined, true);
}

export const api = { load, saveMemory, saveAgent, deleteAgent, setRules, open, reveal, pickDir, resetDir };
export type Api = typeof api;
export type State = Awaited<ReturnType<typeof load>>;
