import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { scopeDir } from "../../host/paths";
import type { Scope } from "../../shared";

export const claudeMdApi = { saveClaudeMd };

async function saveClaudeMd(scope: Scope, text: string) {
	const dir = scopeDir(scope);
	await mkdir(dir, { recursive: true });
	await writeFile(join(dir, "CLAUDE.md"), text);
	return true;
}
