import { mkdir, readdir, rename, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, join } from "node:path";
import * as vscode from "vscode";
import { parseAgent, serializeAgent } from "./agent";
import { commitApi, commitSettings } from "./commit";
import { loadMemory, memoryPath, readText, removeNote, saveIndex, saveNote } from "./memory";
import { notifyApi, notifySettings } from "./notify";
import { pluginsApi } from "./plugins";
import {
	AGENT_NAME,
	KINDS,
	type Kind,
	type Meta,
	type Rules,
	type Scope,
	type ScopeState,
	type Skill,
} from "./shared";

type Settings = Record<string, unknown> & { permissions?: Partial<Record<Kind, unknown>> };

const setting = () =>
	vscode.workspace.getConfiguration("claudeHelper").get<string>("configDir")?.trim() ?? "";

export function configDir() {
	const custom = setting();
	if (custom) return custom.replace(/^~(?=$|[\\/])/, homedir());
	return process.env.CLAUDE_CONFIG_DIR || join(homedir(), ".claude");
}

async function load() {
	const workspace = workspaceDir();
	return {
		global: await loadScope("global"),
		project: workspace ? { ...(await loadScope("project")), name: basename(workspace) } : null,
		custom: !!setting(),
		memory: await loadMemory(join(configDir(), "projects"), workspace),
		notify: notifySettings(),
		commit: commitSettings(),
	};
}

async function saveClaudeMd(scope: Scope, text: string) {
	const dir = scopeDir(scope);
	await mkdir(dir, { recursive: true });
	await writeFile(join(dir, "CLAUDE.md"), text);
	return true;
}

async function saveAgent(scope: Scope, oldFile: string | null, meta: Meta, prompt: string) {
	const name = String(meta.name ?? "");
	if (!AGENT_NAME.test(name)) throw new Error("Name: lowercase letters, digits and single hyphens only");
	if (!String(meta.description ?? "").trim()) throw new Error("Description is required");
	const file = `${name}.md`;
	await mkdir(join(scopeDir(scope), "agents"), { recursive: true });
	if (file.toLowerCase() !== oldFile?.toLowerCase() && (await readText(agentFile(scope, file))) !== null) {
		throw new Error(`Agent "${name}" already exists`);
	}
	if (oldFile && oldFile !== file) await rename(agentFile(scope, oldFile), agentFile(scope, file));
	await writeFile(agentFile(scope, file), serializeAgent(meta, prompt));
	return file;
}

async function deleteAgent(scope: Scope, file: string) {
	const path = agentFile(scope, file);
	if (!(await confirmDelete(`Delete agent "${file.replace(/\.md$/, "")}"?`, path))) return false;
	await rm(path);
	return true;
}

async function saveSkill(scope: Scope, oldName: string | null, meta: Meta, body: string) {
	const name = String(meta.name ?? "");
	if (!AGENT_NAME.test(name)) throw new Error("Name: lowercase letters, digits and single hyphens only");
	if (!String(meta.description ?? "").trim()) throw new Error("Description is required");
	await mkdir(join(scopeDir(scope), "skills"), { recursive: true });
	const taken = (await readdir(join(scopeDir(scope), "skills"))).some(
		(d) => d.toLowerCase() === name.toLowerCase(),
	);
	if (taken && name.toLowerCase() !== oldName?.toLowerCase())
		throw new Error(`Skill "${name}" already exists`);
	if (oldName && oldName !== name) await rename(skillDir(scope, oldName), skillDir(scope, name));
	await mkdir(skillDir(scope, name), { recursive: true });
	await writeFile(join(skillDir(scope, name), "SKILL.md"), serializeAgent(meta, body));
	return name;
}

async function deleteSkill(scope: Scope, name: string) {
	const path = skillDir(scope, name);
	if (!(await confirmDelete(`Delete skill "${name}"?`, path))) return false;
	await rm(path, { recursive: true, force: true });
	return true;
}

async function setRules(scope: Scope, patch: Partial<Rules>) {
	const settings = await readSettings(scope);
	settings.permissions ??= {};
	const permissions = settings.permissions;
	for (const k of KINDS) {
		const list = patch[k];
		if (list) permissions[k] = [...new Set(list.map((r) => r.trim()).filter(Boolean))];
	}
	await mkdir(scopeDir(scope), { recursive: true });
	await writeFile(join(scopeDir(scope), settingsName(scope)), `${JSON.stringify(settings, null, 2)}\n`);
}

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

async function reveal(scope: Scope) {
	const dir = scopeDir(scope);
	await mkdir(dir, { recursive: true });
	await vscode.commands.executeCommand("revealFileInOS", vscode.Uri.file(dir));
}

const memoryRoot = () => join(configDir(), "projects");

async function saveMemoryNote(slug: string, oldFile: string | null, meta: Meta, body: string) {
	return saveNote(memoryRoot(), slug, oldFile, meta, body);
}

async function deleteMemoryNote(slug: string, file: string) {
	const path = memoryPath(memoryRoot(), slug, file);
	if (!(await confirmDelete(`Delete note "${file.replace(/\.md$/, "")}"?`, path))) return false;
	await removeNote(memoryRoot(), slug, file);
	return true;
}

async function saveMemoryIndex(slug: string, text: string) {
	await saveIndex(memoryRoot(), slug, text);
	return true;
}

async function openMemory(slug: string, file: string) {
	await vscode.window.showTextDocument(vscode.Uri.file(memoryPath(memoryRoot(), slug, file)), {
		preview: false,
	});
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

export const api = {
	load,
	saveClaudeMd,
	saveAgent,
	deleteAgent,
	saveSkill,
	deleteSkill,
	setRules,
	open,
	reveal,
	saveMemoryNote,
	deleteMemoryNote,
	saveMemoryIndex,
	openMemory,
	pickDir,
	resetDir,
	...notifyApi,
	...commitApi,
	...pluginsApi,
};
export type Api = typeof api;
export type State = Awaited<ReturnType<typeof load>>;

function workspaceDir() {
	return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? null;
}

function scopeDir(scope: Scope) {
	if (scope === "global") return configDir();
	const workspace = workspaceDir();
	if (!workspace) throw new Error("Open a folder to edit project settings");
	return join(workspace, ".claude");
}

function settingsName(scope: Scope) {
	return scope === "global" ? "settings.json" : "settings.local.json";
}

function agentFile(scope: Scope, file: string) {
	if (basename(file) !== file || !file.endsWith(".md")) throw new Error(`Bad agent file: ${file}`);
	return join(scopeDir(scope), "agents", file);
}

function skillDir(scope: Scope, name: string) {
	if (!name || name === "." || name === ".." || basename(name) !== name)
		throw new Error(`Bad skill: ${name}`);
	return join(scopeDir(scope), "skills", name);
}

async function confirmDelete(message: string, detail: string) {
	return !!(await vscode.window.showWarningMessage(message, { modal: true, detail }, "Delete"));
}

async function readSettings(scope: Scope): Promise<Settings> {
	const text = await readText(join(scopeDir(scope), settingsName(scope)));
	return text?.trim() ? JSON.parse(text) : {};
}

async function loadScope(scope: Scope): Promise<ScopeState> {
	const dir = scopeDir(scope);
	const settingsFile = settingsName(scope);
	const files = (await readdir(join(dir, "agents")).catch(() => [] as string[])).filter((f) =>
		f.endsWith(".md"),
	);
	const agents = await Promise.all(
		files.map(async (f) => parseAgent(f, (await readText(agentFile(scope, f))) ?? "")),
	);
	let rules: Rules = { deny: [], ask: [], allow: [] };
	let settingsError: string | undefined;
	try {
		const p = (await readSettings(scope)).permissions ?? {};
		rules = Object.fromEntries(KINDS.map((k) => [k, Array.isArray(p[k]) ? p[k].map(String) : []])) as Rules;
	} catch (e: unknown) {
		settingsError = `${settingsFile}: ${e instanceof Error ? e.message : String(e)}`;
	}
	return {
		dir,
		claudeMd: await readText(join(dir, "CLAUDE.md")),
		agents: agents.sort((a, b) => a.file.localeCompare(b.file)),
		skills: await loadSkills(join(dir, "skills")),
		rules,
		settingsFile,
		settingsError,
	};
}

async function loadSkills(root: string) {
	const names = await readdir(root).catch(() => [] as string[]);
	const skills = await Promise.all(
		names.map(async (name): Promise<Skill | null> => {
			const text = await readText(join(root, name, "SKILL.md")).catch(() => null);
			if (text === null) return null;
			const { meta, prompt } = parseAgent(name, text);
			const files = (await listFiles(join(root, name))).filter((f) => f !== "SKILL.md").sort();
			return { name, meta, body: prompt, files };
		}),
	);
	return skills.filter((s): s is Skill => s !== null).sort((a, b) => a.name.localeCompare(b.name));
}

async function listFiles(dir: string, prefix = ""): Promise<string[]> {
	const out: string[] = [];
	for (const e of await readdir(join(dir, prefix), { withFileTypes: true })) {
		const rel = prefix ? `${prefix}/${e.name}` : e.name;
		if (e.isDirectory()) out.push(...(await listFiles(dir, rel)));
		else out.push(rel);
	}
	return out;
}
