import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import * as vscode from "vscode";
import { commitSettings, findClaude, runClaude } from "./commit";
import type { CatalogEntry, Marketplace, Plugin, PluginsState } from "./shared";

interface InstalledJson {
	id: string;
	version: string;
	scope: string;
	enabled: boolean;
	installPath: string;
}
interface AvailableJson {
	pluginId: string;
	name: string;
	description?: string;
	marketplaceName: string;
}
interface MarketplaceJson {
	name: string;
	repo?: string;
	url?: string;
	path?: string;
}

const MINUTE = 60_000;

async function loadPlugins(): Promise<PluginsState> {
	const [list, markets] = await Promise.all([
		cli(["plugin", "list", "--json", "--available"]),
		cli(["plugin", "marketplace", "list", "--json"]),
	]);
	const { installed, available } = JSON.parse(list) as {
		installed: InstalledJson[];
		available: AvailableJson[];
	};
	const mine = installed.filter((i) => i.scope === "user");
	const plugins: Plugin[] = await Promise.all(
		mine.map(async (i) => {
			const [name, marketplace = ""] = i.id.split("@");
			return {
				id: i.id,
				name,
				marketplace,
				version: i.version,
				enabled: i.enabled,
				description: await manifestDescription(i.installPath),
			};
		}),
	);
	const configured = JSON.parse(markets) as MarketplaceJson[];
	const names = new Set(configured.map((m) => m.name));
	const catalog: CatalogEntry[] = [
		...available
			.filter((a) => names.has(a.marketplaceName))
			.map((a) => ({
				name: a.name,
				marketplace: a.marketplaceName,
				description: a.description ?? "",
				installed: false,
			})),
		...plugins.map(({ name, marketplace, description }) => ({
			name,
			marketplace,
			description,
			installed: true,
		})),
	].sort((x, y) => x.name.localeCompare(y.name));
	const marketplaces: Marketplace[] = configured.map((m) => ({
		name: m.name,
		source: m.repo ?? m.url ?? m.path ?? "",
		plugins: catalog.filter((c) => c.marketplace === m.name).length,
	}));
	return { installed: plugins, marketplaces, catalog };
}

async function setPluginEnabled(id: string, on: boolean) {
	await cli(["plugin", on ? "enable" : "disable", id]);
	return true;
}

async function uninstallPlugin(id: string) {
	if (!(await confirm(`Uninstall plugin "${id.split("@")[0]}"?`, "Uninstall", id))) return false;
	await cli(["plugin", "uninstall", id]);
	return true;
}

async function installPlugin(id: string) {
	await cli(["plugin", "install", id], 5 * MINUTE);
	return true;
}

async function addMarketplace(source: string) {
	if (!source.trim()) throw new Error("Marketplace source is empty");
	await cli(["plugin", "marketplace", "add", source.trim()], 5 * MINUTE);
	return true;
}

async function removeMarketplace(name: string) {
	if (!(await confirm(`Remove marketplace "${name}"?`, "Remove"))) return false;
	await cli(["plugin", "marketplace", "remove", name]);
	return true;
}

async function updateMarketplace(name: string) {
	await cli(["plugin", "marketplace", "update", name], 5 * MINUTE);
	return true;
}

export const pluginsApi = {
	loadPlugins,
	setPluginEnabled,
	uninstallPlugin,
	installPlugin,
	addMarketplace,
	removeMarketplace,
	updateMarketplace,
};

async function confirm(message: string, action: string, detail?: string) {
	return !!(await vscode.window.showWarningMessage(message, { modal: true, detail }, action));
}

async function manifestDescription(installPath: string) {
	try {
		const manifest = JSON.parse(
			await readFile(join(installPath, ".claude-plugin", "plugin.json"), "utf8"),
		) as {
			description?: string;
		};
		return manifest.description ?? "";
	} catch {
		return "";
	}
}

async function cli(args: string[], timeout = MINUTE) {
	return runClaude(await findClaude(commitSettings().claudePath), args, homedir(), timeout);
}
