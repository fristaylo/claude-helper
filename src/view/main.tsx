import "@vscode/codicons/dist/codicon.css";
import "./style.scss";
import { StrictMode, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { State } from "../claude";
import type { Scope } from "../shared";
import { Agents } from "./Agents";
import { ClaudeMd } from "./ClaudeMd";
import { Commits } from "./Commits";
import { Memory } from "./Memory";
import { Notifications } from "./Notifications";
import { Permissions } from "./Permissions";
import { Plugins } from "./Plugins";
import { Skills } from "./Skills";
import { type Toast, call, onChanged, onToast, run } from "./rpc";
import { Icon, Spark } from "./ui";

type Tab =
	| "agents"
	| "skills"
	| "claudeMd"
	| "memory"
	| "permissions"
	| "plugins"
	| "notifications"
	| "commits";

const GLOBAL_ONLY: Tab[] = ["plugins", "notifications", "commits"];

function App() {
	const [state, setState] = useState<State>();
	const [error, setError] = useState<string>();
	const [tab, setTab] = useState<Tab>("agents");
	const [picked, setPicked] = useState<Scope>("project");
	const [pluginsOpened, setPluginsOpened] = useState(false);

	const load = useCallback(
		() =>
			call("load").then(
				(s) => {
					setState(s);
					setError(undefined);
				},
				(e) => setError(e.message),
			),
		[],
	);
	useEffect(() => {
		load();
		return onChanged(load);
	}, [load]);

	if (!state) {
		return (
			<div className="splash">
				{error ? (
					<>
						<Icon name="error" /> {error}
					</>
				) : (
					<Icon name="loading" className="codicon-modifier-spin" />
				)}
			</div>
		);
	}

	const scope: Scope = state.project ? picked : "global";
	const data = scope === "project" && state.project ? state.project : state.global;
	const locked = GLOBAL_ONLY.includes(tab);
	const tabs: { id: Tab; icon: string; label: string }[] = [
		{ id: "agents", icon: "hubot", label: "Agents" },
		{ id: "skills", icon: "mortar-board", label: "Skills" },
		{ id: "claudeMd", icon: "book", label: "CLAUDE.md" },
		{ id: "memory", icon: "lightbulb", label: "Memory" },
		{ id: "permissions", icon: "shield", label: "Permissions" },
		{ id: "plugins", icon: "extensions", label: "Plugins" },
		{ id: "notifications", icon: "bell", label: "Notifications" },
		{ id: "commits", icon: "git-commit", label: "Commits" },
	];
	const scopes: { id: Scope; icon: string; label: string; dir: string; disabled: boolean }[] = [
		{
			id: "project",
			icon: "folder",
			label: state.project?.name ?? "Project",
			dir: state.project?.dir ?? "Open a folder to use project settings",
			disabled: !state.project,
		},
		{ id: "global", icon: "globe", label: "Global", dir: state.global.dir, disabled: false },
	];

	return (
		<div className="app">
			<header className="top">
				<div className="brand">
					<span className="logo">
						<Spark />
					</span>
					<div>
						<h1>Claude Helper</h1>
						<p className="muted small">Claude Code config, plugins, notifications and commits</p>
					</div>
				</div>
				<div className="scope">
					<div className="segmented" role="tablist">
						{scopes.map((s) => (
							<button
								type="button"
								key={s.id}
								role="tab"
								aria-selected={s.id === scope}
								className={s.id === scope ? "on" : ""}
								disabled={locked || s.disabled}
								title={locked ? "Global only" : s.dir}
								onClick={() => setPicked(s.id)}
							>
								<Icon name={s.icon} />
								{s.label}
							</button>
						))}
					</div>
					{scope === "global" && state.custom && <span className="chip accent">custom</span>}
					{scope === "global" && (
						<button
							type="button"
							className="icon-btn"
							title="Choose folder"
							onClick={() => run(call("pickDir"))}
						>
							<Icon name="folder-opened" />
						</button>
					)}
					{scope === "global" && state.custom && (
						<button
							type="button"
							className="icon-btn"
							title="Back to default folder"
							onClick={() => run(call("resetDir"))}
						>
							<Icon name="discard" />
						</button>
					)}
					<button
						type="button"
						className="icon-btn"
						title="Reveal in file explorer"
						onClick={() => run(call("reveal", scope))}
					>
						<Icon name="link-external" />
					</button>
				</div>
			</header>

			<nav className="nav">
				{tabs.map((t) => (
					<button
						type="button"
						key={t.id}
						className={t.id === tab ? "on" : ""}
						title={t.label}
						aria-label={t.label}
						onClick={() => {
							setTab(t.id);
							if (t.id === "plugins") setPluginsOpened(true);
						}}
					>
						<Icon name={t.icon} />
						<span className="label">{t.label}</span>
					</button>
				))}
			</nav>

			<main>
				<section hidden={tab !== "agents"}>
					<Agents key={scope} scope={scope} agents={data.agents} />
				</section>
				<section hidden={tab !== "skills"}>
					<Skills key={scope} scope={scope} skills={data.skills} />
				</section>
				<section hidden={tab !== "claudeMd"}>
					<ClaudeMd key={scope} scope={scope} text={data.claudeMd} />
				</section>
				<section hidden={tab !== "memory"}>
					<Memory key={scope} scope={scope} memory={state.memory} />
				</section>
				<section hidden={tab !== "permissions"}>
					<Permissions
						key={scope}
						scope={scope}
						rules={data.rules}
						settingsFile={data.settingsFile}
						error={data.settingsError}
					/>
				</section>
				<section hidden={tab !== "plugins"}>{pluginsOpened && <Plugins />}</section>
				<section hidden={tab !== "notifications"}>
					<Notifications settings={state.notify} />
				</section>
				<section hidden={tab !== "commits"}>
					<Commits settings={state.commit} />
				</section>
			</main>
			<Toaster />
		</div>
	);
}

function Toaster() {
	const [toast, setToast] = useState<Toast & { key: number }>();
	useEffect(() => {
		let timer: ReturnType<typeof setTimeout>;
		const off = onToast((t) => {
			clearTimeout(timer);
			setToast({ ...t, key: Date.now() });
			timer = setTimeout(() => setToast(undefined), t.error ? 5000 : 2200);
		});
		return () => {
			off();
			clearTimeout(timer);
		};
	}, []);
	if (!toast) return null;
	return (
		<output key={toast.key} className={`toast ${toast.error ? "error" : ""}`}>
			<Icon name={toast.error ? "error" : "check"} />
			{toast.text}
		</output>
	);
}

createRoot(document.getElementById("root") as HTMLElement).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
