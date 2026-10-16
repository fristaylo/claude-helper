import { mkdir, readdir, rename, rm, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { parseAgent, serializeAgent } from "../../host/frontmatter";
import { scopeDir } from "../../host/paths";
import { confirm, readText } from "../../host/utils";
import { AGENT_NAME, type Meta, type Scope } from "../../shared";
import type { Skill } from "./types";

export async function loadSkills(scope: Scope) {
	const root = join(scopeDir(scope), "skills");
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

export const skillsApi = { saveSkill, deleteSkill };

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
	if (!(await confirm(`Delete skill "${name}"?`, "Delete", path))) return false;
	await rm(path, { recursive: true, force: true });
	return true;
}

function skillDir(scope: Scope, name: string) {
	if (!name || name === "." || name === ".." || basename(name) !== name)
		throw new Error(`Bad skill: ${name}`);
	return join(scopeDir(scope), "skills", name);
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
