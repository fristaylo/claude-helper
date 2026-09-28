import "@vscode/codicons/dist/codicon.css";
import "./style.scss";
import { StrictMode, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { State } from "../claude";
import { Agents } from "./Agents";
import { Memory } from "./Memory";
import { Permissions } from "./Permissions";
import { type Toast, call, onChanged, onToast, run } from "./rpc";
import { Icon, Spark } from "./ui";

const LRM = String.fromCharCode(0x200e);

type Tab = "agents" | "memory" | "permissions";

function App() {
	const [state, setState] = useState<State>();
	const [error, setError] = useState<string>();
	const [tab, setTab] = useState<Tab>("agents");

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

	const { deny, ask, allow } = state.rules;
	const tabs: { id: Tab; icon: string; label: string; count?: number }[] = [
		{ id: "agents", icon: "hubot", label: "Agents", count: state.agents.length },
		{ id: "memory", icon: "book", label: "CLAUDE.md" },
		{
			id: "permissions",
			icon: "shield",
			label: "Permissions",
			count: deny.length + ask.length + allow.length,
		},
	];

	return (
		<div className="app">
			<header className="top">
				<div className="brand">
					<span className="logo">
						<Spark />
					</span>
					<div>
						<h1>Claude Agents</h1>
						<p className="muted small">Global Claude Code configuration</p>
					</div>
				</div>
				<div className="dir" title={state.dir}>
					<Icon name="folder" />
					<span className="path">{`${LRM}${state.dir}${LRM}`}</span>
					{state.custom && <span className="chip accent">custom</span>}
					<button
						type="button"
						className="icon-btn"
						title="Choose folder"
						onClick={() => run(call("pickDir"))}
					>
						<Icon name="folder-opened" />
					</button>
					{state.custom && (
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
						onClick={() => run(call("reveal"))}
					>
						<Icon name="link-external" />
					</button>
				</div>
			</header>

			<nav className="nav">
				{tabs.map((t) => (
					<button type="button" key={t.id} className={t.id === tab ? "on" : ""} onClick={() => setTab(t.id)}>
						<Icon name={t.icon} />
						<span>{t.label}</span>
						{t.count !== undefined && <span className="count">{t.count}</span>}
					</button>
				))}
			</nav>

			<main>
				<section hidden={tab !== "agents"}>
					<Agents agents={state.agents} />
				</section>
				<section hidden={tab !== "memory"}>
					<Memory text={state.memory} />
				</section>
				<section hidden={tab !== "permissions"}>
					<Permissions rules={state.rules} error={state.settingsError} />
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
