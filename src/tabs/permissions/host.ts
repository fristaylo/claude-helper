import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { scopeDir, settingsName } from "../../host/paths";
import { readText } from "../../host/utils";
import type { Scope } from "../../shared";
import { KINDS, type Kind, type Rules } from "./types";

type Settings = Record<string, unknown> & { permissions?: Partial<Record<Kind, unknown>> };

export async function loadRules(scope: Scope): Promise<{ rules: Rules; settingsError?: string }> {
	let rules: Rules = { deny: [], ask: [], allow: [] };
	let settingsError: string | undefined;
	try {
		const p = (await readSettings(scope)).permissions ?? {};
		rules = Object.fromEntries(KINDS.map((k) => [k, Array.isArray(p[k]) ? p[k].map(String) : []])) as Rules;
	} catch (e: unknown) {
		settingsError = `${settingsName(scope)}: ${e instanceof Error ? e.message : String(e)}`;
	}
	return { rules, settingsError };
}

export const permissionsApi = { setRules };

async function readSettings(scope: Scope): Promise<Settings> {
	const text = await readText(join(scopeDir(scope), settingsName(scope)));
	return text?.trim() ? JSON.parse(text) : {};
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
