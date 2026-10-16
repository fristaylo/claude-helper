import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import { parseAgent, serializeAgent } from "./agent";
import { MEMORY_NAME, type MemoryProject, type Meta } from "./shared";

const INDEX = "MEMORY.md";

export const slug = (path: string) => path.replace(/[^A-Za-z0-9]/g, "-");

export async function readText(file: string) {
	try {
		return (await readFile(file, "utf8")).replace(/^﻿/, "");
	} catch (e: unknown) {
		if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
		throw e;
	}
}

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

export async function saveNote(
	root: string,
	project: string,
	oldFile: string | null,
	meta: Meta,
	body: string,
) {
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

export async function removeNote(root: string, project: string, file: string) {
	await rm(notePath(root, project, file));
	const index = memoryPath(root, project);
	const text = await readText(index);
	if (text !== null) await writeFile(index, indexRemove(text, file));
}

export async function saveIndex(root: string, project: string, text: string) {
	const path = memoryPath(root, project);
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, text);
}

export function memoryPath(root: string, project: string, file = INDEX) {
	if (!/^[A-Za-z0-9-]+$/.test(project)) throw new Error(`Bad project: ${project}`);
	if (basename(file) !== file || !file.endsWith(".md")) throw new Error(`Bad memory file: ${file}`);
	return join(root, project, "memory", file);
}

export function indexAdd(text: string | null, title: string, file: string, description: string) {
	const line = `- [${title}](${file}) — ${description.replace(/\s+/g, " ").trim()}\n`;
	if (!text) return line;
	return (text.endsWith("\n") ? text : `${text}\n`) + line;
}

export function indexRename(text: string, oldFile: string, newFile: string) {
	return text.split(`](${oldFile})`).join(`](${newFile})`);
}

export function indexRemove(text: string, file: string) {
	return text
		.split("\n")
		.filter((line) => !line.includes(`](${file})`))
		.join("\n");
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
