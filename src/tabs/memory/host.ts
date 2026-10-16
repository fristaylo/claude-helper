import { mkdir, readdir, rename, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import * as vscode from "vscode";
import { parseAgent, serializeAgent } from "../../host/frontmatter";
import { configDir } from "../../host/paths";
import { confirm, readText } from "../../host/utils";
import type { Meta } from "../../shared";
import { indexAdd, indexRemove, indexRename, slug } from "./memoryIndex";
import { MEMORY_NAME, type MemoryProject } from "./types";

export async function loadMemory(root: string, workspace: string | null) {
	const dirs = await readdir(root).catch(() => [] as string[]);
	const want = workspace ? slug(workspace) : null;
	const currentSlug = want ? (dirs.find((d) => d.toLowerCase() === want.toLowerCase()) ?? want) : null;
	const current = workspace && currentSlug ? await readProject(root, currentSlug, basename(workspace)) : null;
	const home = slug(homedir()).toLowerCase();
	const others = (
		await Promise.all(
			dirs
				.filter((d) => d !== currentSlug)
				.map((d) => readProject(root, d, d.toLowerCase().startsWith(home) ? d.slice(home.length) : d)),
		)
	)
		.filter((p) => p.index !== null || p.notes.length)
		.sort((a, b) => a.label.localeCompare(b.label));
	return { current, others };
}

export const memoryRoot = () => join(configDir(), "projects");

export const memoryApi = { saveMemoryNote, deleteMemoryNote, saveMemoryIndex, openMemory };

async function saveMemoryNote(slug: string, oldFile: string | null, meta: Meta, body: string) {
	return saveNote(memoryRoot(), slug, oldFile, meta, body);
}

async function deleteMemoryNote(slug: string, file: string) {
	const path = memoryPath(memoryRoot(), slug, file);
	if (!(await confirm(`Delete note "${file.replace(/\.md$/, "")}"?`, "Delete", path))) return false;
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

const INDEX = "MEMORY.md";

async function saveNote(root: string, project: string, oldFile: string | null, meta: Meta, body: string) {
	const name = String(meta.name ?? "");
	if (!MEMORY_NAME.test(name)) throw new Error("Name: letters, digits, single hyphens or underscores");
	const description = String(meta.description ?? "").trim();
	if (!description) throw new Error("Description is required");
	const file = `${name}.md`;
	const path = notePath(root, project, file);
	const oldPath = oldFile ? notePath(root, project, oldFile) : null;
	await mkdir(dirname(path), { recursive: true });
	const same = file.toLowerCase() === oldFile?.toLowerCase();
	if (!same && (await readText(path)) !== null) throw new Error(`Note "${name}" already exists`);
	if (oldPath && oldFile !== file) await rename(oldPath, path);
	await writeFile(path, serializeAgent(meta, body));
	const index = memoryPath(root, project);
	const text = await readText(index);
	if (!oldFile) await writeFile(index, indexAdd(text, name, file, description));
	else if (oldFile !== file && text !== null) await writeFile(index, indexRename(text, oldFile, file));
	return file;
}

async function removeNote(root: string, project: string, file: string) {
	await rm(notePath(root, project, file));
	const index = memoryPath(root, project);
	const text = await readText(index);
	if (text !== null) await writeFile(index, indexRemove(text, file));
}

async function saveIndex(root: string, project: string, text: string) {
	const path = memoryPath(root, project);
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, text);
}

function memoryPath(root: string, project: string, file = INDEX) {
	if (!/^[A-Za-z0-9-]+$/.test(project)) throw new Error(`Bad project: ${project}`);
	if (basename(file) !== file || !file.endsWith(".md")) throw new Error(`Bad memory file: ${file}`);
	return join(root, project, "memory", file);
}

function notePath(root: string, project: string, file: string) {
	if (file.toLowerCase() === INDEX.toLowerCase()) throw new Error(`Bad memory file: ${file}`);
	return memoryPath(root, project, file);
}

async function readProject(root: string, project: string, label: string): Promise<MemoryProject> {
	const dir = join(root, project, "memory");
	const files = (await readdir(dir).catch(() => [] as string[])).filter(
		(f) => f.endsWith(".md") && f !== INDEX,
	);
	const notes = await Promise.all(
		files.map(async (f) => {
			const { meta, prompt } = parseAgent(f, (await readText(join(dir, f))) ?? "");
			return { file: f, meta, body: prompt };
		}),
	);
	return {
		slug: project,
		label: label.replace(/^-+/, "") || project,
		index: await readText(join(dir, INDEX)),
		notes: notes.sort((a, b) => a.file.localeCompare(b.file)),
	};
}
