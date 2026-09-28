import { randomBytes } from "node:crypto";
import * as vscode from "vscode";
import { api, configDir } from "./claude";
import { checkForUpdate } from "./update";

export function activate(ctx: vscode.ExtensionContext) {
	checkForUpdate(ctx).catch((e) => console.warn("Claude Agents: update check failed", e));

	const webviews = new Set<vscode.Webview>();
	const refresh = () => {
		for (const w of webviews) w.postMessage({ type: "changed" });
	};

	const host = (webview: vscode.Webview, onDispose: vscode.Event<void>) => {
		const dist = vscode.Uri.joinPath(ctx.extensionUri, "dist");
		webview.options = { enableScripts: true, localResourceRoots: [dist] };
		webview.html = html(webview, vscode.Uri.joinPath(dist, "view.js"));
		webviews.add(webview);
		const sub = webview.onDidReceiveMessage(async ({ id, method, params }) => {
			try {
				if (!Object.hasOwn(api, method)) throw new Error(`Unknown method ${method}`);
				webview.postMessage({ id, result: await (api as any)[method](...params) });
				if (method !== "load") refresh();
			} catch (e: any) {
				webview.postMessage({ id, error: e?.message ?? String(e) });
			}
		});
		onDispose(() => {
			webviews.delete(webview);
			sub.dispose();
		});
	};

	let watchers: vscode.FileSystemWatcher[] = [];
	const watch = () => {
		for (const w of watchers) w.dispose();
		const dir = vscode.Uri.file(configDir());
		watchers = [
			new vscode.RelativePattern(dir, "{CLAUDE.md,settings.json}"),
			new vscode.RelativePattern(vscode.Uri.joinPath(dir, "agents"), "*.md"),
		].map((pattern) => {
			const w = vscode.workspace.createFileSystemWatcher(pattern);
			w.onDidChange(refresh);
			w.onDidCreate(refresh);
			w.onDidDelete(refresh);
			return w;
		});
	};
	watch();

	let panel: vscode.WebviewPanel | undefined;
	ctx.subscriptions.push(
		{
			dispose: () => {
				for (const w of watchers) w.dispose();
			},
		},
		vscode.window.registerWebviewViewProvider(
			"claudeAgents.view",
			{
				resolveWebviewView(view) {
					host(view.webview, view.onDidDispose);
					view.onDidChangeVisibility(() => view.visible && refresh());
				},
			},
			{ webviewOptions: { retainContextWhenHidden: true } },
		),
		vscode.commands.registerCommand("claudeAgents.open", () => {
			if (panel) return panel.reveal();
			panel = vscode.window.createWebviewPanel(
				"claudeAgents.panel",
				"Claude Agents",
				vscode.ViewColumn.Active,
				{
					retainContextWhenHidden: true,
				},
			);
			panel.iconPath = vscode.Uri.joinPath(ctx.extensionUri, "resources", "icon.png");
			panel.onDidDispose(() => {
				panel = undefined;
			});
			host(panel.webview, panel.onDidDispose);
		}),
		vscode.commands.registerCommand("claudeAgents.refresh", refresh),
		vscode.workspace.onDidChangeConfiguration((e) => {
			if (!e.affectsConfiguration("claudeAgents.configDir")) return;
			watch();
			refresh();
		}),
	);
}

function html(webview: vscode.Webview, script: vscode.Uri) {
	const nonce = randomBytes(16).toString("hex");
	const csp = [
		"default-src 'none'",
		`img-src ${webview.cspSource} https: data:`,
		`style-src ${webview.cspSource} 'unsafe-inline'`,
		`font-src ${webview.cspSource} data:`,
		`script-src 'nonce-${nonce}'`,
	].join("; ");
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy" content="${csp}">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Claude Agents</title>
</head>
<body>
	<div id="root"></div>
	<script nonce="${nonce}" src="${webview.asWebviewUri(script)}"></script>
</body>
</html>`;
}

export function deactivate() {}
