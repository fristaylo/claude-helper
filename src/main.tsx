import "@vscode/codicons/dist/codicon.css";
import "./main.scss";
import { StrictMode, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Header } from "./components/Header/Header";
import { Nav } from "./components/Nav/Nav";
import { Toaster } from "./components/Toaster/Toaster";
import type { State } from "./host/api";
import { Icon } from "./icons";
import { call, onChanged } from "./rpc";
import type { Scope } from "./shared";
import { Agents } from "./tabs/agents/Agents/Agents";
import { ClaudeMd } from "./tabs/claudeMd/ClaudeMd/ClaudeMd";
import { Commits } from "./tabs/commits/Commits/Commits";
import { Memory } from "./tabs/memory/Memory/Memory";
import { Notifications } from "./tabs/notifications/Notifications/Notifications";
import { Permissions } from "./tabs/permissions/Permissions/Permissions";
import { Plugins } from "./tabs/plugins/Plugins/Plugins";
import { Skills } from "./tabs/skills/Skills/Skills";

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

const TABS: { id: Tab; icon: string; label: string }[] = [
	{ id: "agents", icon: "hubot", label: "Agents" },
	{ id: "skills", icon: "mortar-board", label: "Skills" },
	{ id: "claudeMd", icon: "book", label: "CLAUDE.md" },
	{ id: "memory", icon: "lightbulb", label: "Memory" },
	{ id: "permissions", icon: "shield", label: "Permissions" },
	{ id: "plugins", icon: "extensions", label: "Plugins" },
	{ id: "notifications", icon: "bell", label: "Notifications" },
	{ id: "commits", icon: "git-commit", label: "Commits" },
];

function App() {
	const [state, setState] = useState<State>();
	const [error, setError] = useState<string>();
	const [tab, setTab] = useState<Tab>("agents");
	const [picked, setPicked] = useState<Scope>("global");
	const [pluginsOpened, setPluginsOpened] = useState(false);

	const load = useCallback(
		() =>
			call("load").then(
				(s) => {
					setState(s);
					setError(undefined);
				},
				(e: Error) => setError(e.message),
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

	return (
		<div className="app">
			<Header state={state} scope={scope} locked={GLOBAL_ONLY.includes(tab)} onScope={setPicked} />
			<Nav
				tabs={TABS}
				tab={tab}
				onTab={(t) => {
					setTab(t);
					if (t === "plugins") setPluginsOpened(true);
				}}
			/>

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

createRoot(document.getElementById("root") as HTMLElement).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
