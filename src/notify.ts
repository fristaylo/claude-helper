import { execFile } from "node:child_process";
import {
	type FSWatcher,
	mkdirSync,
	readFileSync,
	readdirSync,
	statSync,
	watch,
	writeFileSync,
} from "node:fs";
import { basename, isAbsolute, join, relative, sep } from "node:path";
import * as vscode from "vscode";
import type { EventConfig, NotifyEvent, NotifyPatch, NotifySettings } from "./shared";

const DEFAULTS: Record<NotifyEvent, EventConfig> = {
	done: { sound: true, popup: true, file: "chime-up-third", volume: 100 },
	permission: { sound: true, popup: true, file: "bong", volume: 100 },
	question: { sound: true, popup: true, file: "chime-question", volume: 100 },
	subagent: { sound: false, popup: false, file: "kalimba-up", volume: 100 },
	commit: { sound: true, popup: true, file: "marimba-up", volume: 100 },
};

const HOOKS: { hook: string; event: NotifyEvent; matcher?: string }[] = [
	{ hook: "Stop", event: "done" },
	{ hook: "SubagentStop", event: "subagent" },
	{ hook: "PermissionRequest", event: "permission" },
	{ hook: "PreToolUse", event: "question", matcher: "AskUserQuestion" },
];

const TEXT: Record<NotifyEvent, string> = {
	done: "Claude finished the task",
	permission: "Claude needs permission",
	question: "Claude is asking a question",
	subagent: "Claude subagent finished",
	commit: "Commit message is ready",
};

let soundsDir = "";

export function startNotifications(ctx: vscode.ExtensionContext, configDir: () => string): void {
	soundsDir = join(ctx.extensionUri.fsPath, "resources", "sounds");
	const started = Date.now();
	const bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	bar.command = "claudeHelper.toggleNotifications";
	const render = () => {
		const on = config().get<boolean>("notifications.enabled", true);
		bar.text = on ? "$(bell) Claude" : "$(bell-slash) Claude";
		bar.tooltip = on
			? "Claude notifications on — click to mute"
			: "Claude notifications off — click to unmute";
	};
	render();
	bar.show();

	let watcher: FSWatcher | undefined;
	const timers = new Map<string, NodeJS.Timeout>();
	const setup = () => {
		watcher?.close();
		watcher = undefined;
		const events = installHooks(configDir());
		if (!events) return;
		try {
			watcher = watch(events, (_, name) => {
				if (!name?.endsWith(".json")) return;
				clearTimeout(timers.get(name));
				timers.set(
					name,
					setTimeout(() => {
						timers.delete(name);
						receive(join(events, name), name.slice(0, -5), started);
					}, 150),
				);
			});
			watcher.on("error", (e) => console.warn("Claude Helper: watch error", e));
		} catch (e) {
			console.warn("Claude Helper: watch failed", e);
		}
	};
	setup();

	ctx.subscriptions.push(
		bar,
		vscode.commands.registerCommand("claudeHelper.toggleNotifications", () =>
			config().update("notifications.enabled", !config().get<boolean>("notifications.enabled", true), true),
		),
		vscode.workspace.onDidChangeConfiguration((e) => {
			if (e.affectsConfiguration("claudeHelper.notifications")) render();
			if (e.affectsConfiguration("claudeHelper.configDir")) setup();
		}),
		{
			dispose: () => {
				watcher?.close();
				for (const t of timers.values()) clearTimeout(t);
			},
		},
	);
}

export function notify(event: NotifyEvent, detail?: string): void {
	const s = notifySettings();
	if (!s.enabled) return;
	const cfg = s.events[event];
	if (cfg.sound) play(cfg.file, cfg.volume);
	if (cfg.popup)
		vscode.window.showInformationMessage(
			detail ? `${TEXT[event]}${event === "permission" ? ": " : " · "}${detail}` : TEXT[event],
		);
}

export function notifySettings(): NotifySettings {
	const c = config();
	const saved = c.get<Partial<Record<NotifyEvent, Partial<EventConfig>>>>("notifications.events") ?? {};
	let sounds: string[] = [];
	try {
		sounds = readdirSync(soundsDir)
			.filter((f) => f.endsWith(".wav"))
			.map((f) => f.slice(0, -4))
			.sort();
	} catch (e) {
		console.warn("Claude Helper: sounds", e);
	}
	const events = Object.fromEntries(
		Object.entries(DEFAULTS).map(([k, v]) => {
			const e = { ...v, ...saved[k as NotifyEvent] };
			if (!Number.isFinite(e.volume)) e.volume = v.volume;
			return [k, sounds.includes(e.file) ? e : { ...e, file: v.file }];
		}),
	) as Record<NotifyEvent, EventConfig>;
	return { enabled: c.get<boolean>("notifications.enabled", true), events, sounds };
}

async function setNotify(patch: NotifyPatch) {
	if (patch.enabled !== undefined) await config().update("notifications.enabled", patch.enabled, true);
	if (patch.events)
		await config().update("notifications.events", { ...notifySettings().events, ...patch.events }, true);
	return true;
}

async function previewSound(file: string, volume: number) {
	if (!notifySettings().sounds.includes(file)) throw new Error(`Unknown sound: ${file}`);
	play(file, volume);
}

export const notifyApi = { setNotify, previewSound };

const config = () => vscode.workspace.getConfiguration("claudeHelper");

interface HookGroup {
	matcher?: string;
	hooks?: { type?: string; command?: string }[];
}

function installHooks(root: string): string | undefined {
	try {
		const dir = join(root, "claude-helper");
		const events = join(dir, "events");
		mkdirSync(events, { recursive: true });
		const win = process.platform === "win32";
		if (win)
			writeFileSync(
				join(dir, "hook.ps1"),
				'$o = [IO.File]::Create((Join-Path $PSScriptRoot "events\\$($args[0]).json"))\n[Console]::OpenStandardInput().CopyTo($o)\n$o.Close()\n',
			);
		const command = (e: NotifyEvent) =>
			win
				? `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${join(dir, "hook.ps1")}" ${e}`
				: `cat > '${join(events, `${e}.json`).replace(/'/g, "'\\''")}'`;

		const file = join(root, "settings.json");
		let text = "";
		try {
			text = readFileSync(file, "utf8").replace(/^\uFEFF/, "");
		} catch (e) {
			if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
		}
		let s: { hooks?: Record<string, HookGroup[]> } & Record<string, unknown>;
		try {
			s = text.trim() ? JSON.parse(text) : {};
		} catch (e) {
			console.warn("Claude Helper: settings.json is not valid JSON, hooks not installed", e);
			return events;
		}
		s.hooks = mergeHooks(s.hooks ?? {}, command);
		const next = `${JSON.stringify(s, null, 2)}\n`;
		if (next !== text) writeFileSync(file, next);
		return events;
	} catch (e) {
		console.warn("Claude Helper: install hooks failed", e);
	}
}

function receive(path: string, event: string, started: number) {
	if (!HOOKS.some((h) => h.event === event)) return;
	let payload: { cwd?: string; tool_name?: string; background_tasks?: { type?: string }[] };
	try {
		if (statSync(path).mtimeMs < started) return;
		payload = JSON.parse(readFileSync(path, "utf8"));
	} catch {
		return;
	}
	const cwd = payload.cwd;
	if (!cwd || !vscode.workspace.workspaceFolders?.some((f) => inside(f.uri.fsPath, cwd))) return;
	if (event === "permission") {
		if (payload.tool_name === "AskUserQuestion") return;
		notify(event, payload.tool_name ? `${payload.tool_name} · ${basename(cwd)}` : basename(cwd));
	} else if (event === "done") {
		if (payload.background_tasks?.some((t) => t.type === "subagent" || t.type === "workflow")) return;
		notify(event, basename(cwd));
	} else notify(event as NotifyEvent, basename(cwd));
}

function inside(folder: string, cwd: string) {
	const win = process.platform === "win32";
	const r = relative(win ? folder.toLowerCase() : folder, win ? cwd.toLowerCase() : cwd);
	return r !== ".." && !r.startsWith(`..${sep}`) && !isAbsolute(r);
}

function play(file: string, volume: number) {
	const v = Math.min(100, Math.max(0, volume)) / 100;
	if (!v) return;
	const path = join(soundsDir, `${file}.wav`);
	const warn = (e: Error | null) => e && console.warn("Claude Helper: play failed", e);
	if (process.platform === "win32")
		execFile(
			"powershell",
			[
				"-NoProfile",
				"-NonInteractive",
				"-Command",
				`Add-Type -AssemblyName PresentationCore; $p = New-Object System.Windows.Media.MediaPlayer; $p.Open([Uri]'${path.replace(/'/g, "''")}'); $p.Volume = ${v.toFixed(2)}; $p.Play(); $i = 0; while (-not $p.NaturalDuration.HasTimeSpan -and $i -lt 40) { Start-Sleep -Milliseconds 50; $i++ }; if ($p.NaturalDuration.HasTimeSpan) { Start-Sleep -Milliseconds ([int]$p.NaturalDuration.TimeSpan.TotalMilliseconds + 100) }; $p.Close()`,
			],
			{ windowsHide: true },
			warn,
		);
	else if (process.platform === "darwin") execFile("afplay", ["-v", v.toFixed(2), path], warn);
	else
		execFile(
			"paplay",
			[`--volume=${Math.round(v * 65536)}`, path],
			(e) => e && execFile("aplay", [path], warn),
		);
}

function mergeHooks(hooks: Record<string, HookGroup[]>, command: (e: NotifyEvent) => string) {
	const ours = (h: { command?: string }) => /claude-helper[\\/](hook\.ps1|events[\\/])/.test(h.command ?? "");
	for (const h of HOOKS) {
		const groups = (hooks[h.hook] ?? []).flatMap((g) => {
			if (!g.hooks?.some(ours)) return [g];
			const rest = g.hooks.filter((x) => !ours(x));
			return rest.length ? [{ ...g, hooks: rest }] : [];
		});
		groups.push({
			...(h.matcher && { matcher: h.matcher }),
			hooks: [{ type: "command", command: command(h.event) }],
		});
		hooks[h.hook] = groups;
	}
	return hooks;
}
