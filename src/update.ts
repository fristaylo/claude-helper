import * as vscode from "vscode";

const LATEST = "https://api.github.com/repos/fristaylo/claude-agents/releases/latest";

// ponytail: every open window checks on its own; add a globalState throttle if that gets noisy
export async function checkForUpdate(ctx: vscode.ExtensionContext) {
	if (ctx.extensionMode !== vscode.ExtensionMode.Production) return;
	const res = await fetch(LATEST);
	if (!res.ok) return;
	const rel = (await res.json()) as {
		tag_name: string;
		assets: { name: string; browser_download_url: string }[];
	};
	const latest = rel.tag_name.replace(/^v/, "");
	if (latest.localeCompare(ctx.extension.packageJSON.version, undefined, { numeric: true }) <= 0) return;
	const asset = rel.assets.find((a) => a.name.endsWith(".vsix"));
	if (!asset) return;

	const vsix = vscode.Uri.joinPath(ctx.globalStorageUri, asset.name);
	await vscode.workspace.fs.createDirectory(ctx.globalStorageUri);
	await vscode.workspace.fs.writeFile(
		vsix,
		new Uint8Array(await (await fetch(asset.browser_download_url)).arrayBuffer()),
	);
	await vscode.commands.executeCommand("workbench.extensions.installExtension", vsix);
	const pick = await vscode.window.showInformationMessage(
		`Claude Agents updated to ${latest}.`,
		"Reload Window",
	);
	if (pick) vscode.commands.executeCommand("workbench.action.reloadWindow");
}
