import { type ReactNode, useCallback, useEffect, useState } from "react";
import { Button } from "../../../components/Button/Button";
import { Empty } from "../../../components/Empty/Empty";
import { Icon } from "../../../icons";
import { call, run, toast } from "../../../rpc";
import { Catalog } from "../Catalog/Catalog";
import { Installed } from "../Installed/Installed";
import { Marketplaces } from "../Marketplaces/Marketplaces";
import type { PluginsState } from "../types";

export type Act = (key: string, task: Promise<boolean>, ok: string) => Promise<boolean>;
export type Spin = (key: string, icon: string) => ReactNode;

export function Plugins() {
	const [state, setState] = useState<PluginsState>();
	const [view, setView] = useState<"installed" | "catalog" | "markets">("installed");
	const [busy, setBusy] = useState<string[]>([]);
	const [q, setQ] = useState("");
	const [filter, setFilter] = useState("");
	const [source, setSource] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const reload = useCallback(async () => {
		setLoading(true);
		try {
			setState(await call("loadPlugins"));
			setError("");
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			setError(message);
			toast(message, true);
		}
		setLoading(false);
	}, []);
	useEffect(() => {
		reload();
	}, [reload]);

	const act: Act = async (key, task, ok) => {
		setBusy((b) => [...b, key]);
		const done = await run(task);
		if (done) {
			toast(ok);
			await reload();
		}
		setBusy((b) => b.filter((k) => k !== key));
		return !!done;
	};

	const spin: Spin = (key, icon) => (
		<Icon
			name={busy.includes(key) ? "loading" : icon}
			className={busy.includes(key) ? "codicon-modifier-spin" : ""}
		/>
	);

	if (!state)
		return (
			<div className="page">
				{error && !loading ? (
					<Empty icon="error" title="Failed to load plugins">
						<p>{error}</p>
						<Button variant="ghost" icon="refresh" onClick={reload}>
							Retry
						</Button>
					</Empty>
				) : (
					<p className="muted">
						<Icon name="loading" className="codicon-modifier-spin" /> Loading plugins...
					</p>
				)}
			</div>
		);

	if (view === "markets")
		return (
			<Marketplaces
				markets={state.marketplaces}
				busy={busy}
				act={act}
				spin={spin}
				source={source}
				onSource={setSource}
				onBack={() => setView("catalog")}
			/>
		);
	if (view === "catalog")
		return (
			<Catalog
				state={state}
				busy={busy}
				act={act}
				spin={spin}
				q={q}
				onQ={setQ}
				filter={filter}
				onFilter={setFilter}
				onBack={() => setView("installed")}
				onMarkets={() => setView("markets")}
			/>
		);
	return (
		<Installed plugins={state.installed} busy={busy} act={act} spin={spin} onAdd={() => setView("catalog")} />
	);
}
