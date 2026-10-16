import { mkdir, readdir, rename, rm, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { parseAgent, serializeAgent } from "../../host/frontmatter";
import { scopeDir } from "../../host/paths";
import { confirm, readText } from "../../host/utils";
import { AGENT_NAME, type Meta, type Scope } from "../../shared";
import type { Agent } from "./types";

export async function loadAgents(scope: Scope): Promise<Agent[]> {
	const files = (await readdir(join(scopeDir(scope), "agents")).catch(() => [] as string[])).filter((f) =>
		f.endsWith(".md"),
	);
	const agents = await Promise.all(
		files.map(async (f) => parseAgent(f, (await readText(agentFile(scope, f))) ?? "")),
	);
	return agents.sort((a, b) => a.file.localeCompare(b.file));
}

export const agentsApi = { saveAgent, deleteAgent };

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
	if (!(await confirm(`Delete agent "${file.replace(/\.md$/, "")}"?`, "Delete", path))) return false;
	await rm(path);
	return true;
}

function agentFile(scope: Scope, file: string) {
	if (basename(file) !== file || !file.endsWith(".md")) throw new Error(`Bad agent file: ${file}`);
	return join(scopeDir(scope), "agents", file);
}
