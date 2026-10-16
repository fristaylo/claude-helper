import { randomBytes } from "node:crypto";
import * as vscode from "vscode";
import { registerCommit } from "../tabs/commits/host";
import { startNotifications } from "../tabs/notifications/host";
import { type Api, api } from "./api";
import { configDir } from "./paths";
import { checkForUpdate } from "./update";

export function activate(ctx: vscode.ExtensionContext) {
	checkForUpdate(ctx).catch((e) => console.warn("Claude Helper: update check failed", e));

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
				const call = api[method as keyof Api] as (...args: unknown[]) => unknown;
				webview.postMessage({ id, result: await call(...params) });
				if (!method.startsWith("load")) refresh();
			} catch (e: unknown) {
				webview.postMessage({ id, error: e instanceof Error ? e.message : String(e) });
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
		const folder = vscode.workspace.workspaceFolders?.[0];
		watchers = [
			new vscode.RelativePattern(dir, "{CLAUDE.md,settings.json}"),
			new vscode.RelativePattern(dir, "agents/*.md"),
			new vscode.RelativePattern(dir, "skills/**"),
			new vscode.RelativePattern(dir, "projects/*/memory/*.md"),
			...(folder ? [new vscode.RelativePattern(folder, ".claude/**")] : []),
		].map((pattern) => {
			const w = vscode.workspace.createFileSystemWatcher(pattern);
			w.onDidChange(refresh);
			w.onDidCreate(refresh);
			w.onDidDelete(refresh);
			return w;
		});
	};
	watch();
	startNotifications(ctx, configDir);
	registerCommit(ctx);

	let panel: vscode.WebviewPanel | undefined;
	ctx.subscriptions.push(
		{
			dispose: () => {
				for (const w of watchers) w.dispose();
			},
		},
		vscode.window.registerWebviewViewProvider(
			"claudeHelper.view",
			{
				resolveWebviewView(view) {
					host(view.webview, view.onDidDispose);
					view.onDidChangeVisibility(() => view.visible && refresh());
				},
			},
			{ webviewOptions: { retainContextWhenHidden: true } },
		),
		vscode.commands.registerCommand("claudeHelper.open", () => {
			if (panel) return panel.reveal();
			panel = vscode.window.createWebviewPanel(
				"claudeHelper.panel",
				"Claude Helper",
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
		vscode.commands.registerCommand("claudeHelper.refresh", refresh),
		vscode.workspace.onDidChangeWorkspaceFolders(() => {
			watch();
			refresh();
		}),
		vscode.workspace.onDidChangeConfiguration((e) => {
			if (!e.affectsConfiguration("claudeHelper")) return;
			if (e.affectsConfiguration("claudeHelper.configDir")) watch();
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
	<title>Claude Helper</title>
</head>
<body>
	<div id="root"></div>
	<script nonce="${nonce}" src="${webview.asWebviewUri(script)}"></script>
</body>
</html>`;
}

export function deactivate() {}
