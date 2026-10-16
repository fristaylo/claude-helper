import { basename, join } from "node:path";
import type { Scope } from "../shared";
import { agentsApi, loadAgents } from "../tabs/agents/host";
import type { Agent } from "../tabs/agents/types";
import { claudeMdApi } from "../tabs/claudeMd/host";
import { commitApi, commitSettings } from "../tabs/commits/host";
import { loadMemory, memoryApi, memoryRoot } from "../tabs/memory/host";
import { notifyApi, notifySettings } from "../tabs/notifications/host";
import { loadRules, permissionsApi } from "../tabs/permissions/host";
import type { Rules } from "../tabs/permissions/types";
import { pluginsApi } from "../tabs/plugins/host";
import { loadSkills, skillsApi } from "../tabs/skills/host";
import type { Skill } from "../tabs/skills/types";
import { isCustomDir, pathsApi, scopeDir, settingsName, workspaceDir } from "./paths";
import { readText, utilsApi } from "./utils";

export interface ScopeState {
	dir: string;
	claudeMd: string | null;
	agents: Agent[];
	skills: Skill[];
	rules: Rules;
	settingsFile: string;
	settingsError?: string;
}

async function load() {
	const workspace = workspaceDir();
	return {
		global: await loadScope("global"),
		project: workspace ? { ...(await loadScope("project")), name: basename(workspace) } : null,
		custom: isCustomDir(),
		memory: await loadMemory(memoryRoot(), workspace),
		notify: notifySettings(),
		commit: commitSettings(),
	};
}

export const api = {
	load,
	...pathsApi,
	...utilsApi,
	...agentsApi,
	...skillsApi,
	...claudeMdApi,
	...permissionsApi,
	...memoryApi,
	...notifyApi,
	...commitApi,
	...pluginsApi,
};
export type Api = typeof api;
export type State = Awaited<ReturnType<typeof load>>;

async function loadScope(scope: Scope): Promise<ScopeState> {
	const dir = scopeDir(scope);
	return {
		dir,
		claudeMd: await readText(join(dir, "CLAUDE.md")),
		agents: await loadAgents(scope),
		skills: await loadSkills(scope),
		settingsFile: settingsName(scope),
		...(await loadRules(scope)),
	};
}
