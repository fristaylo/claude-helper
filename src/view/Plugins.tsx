import { useCallback, useEffect, useState } from "react";
import type { CatalogEntry, Marketplace, Plugin, PluginsState } from "../shared";
import { call, run, toast } from "./rpc";
import { Empty, Icon } from "./ui";

const LIMIT = 100;

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

	const act = async (key: string, task: Promise<boolean>, ok: string) => {
		setBusy((b) => [...b, key]);
		const done = await run(task);
		if (done) {
			toast(ok);
			await reload();
		}
		setBusy((b) => b.filter((k) => k !== key));
		return done;
	};

	if (!state)
		return (
			<div className="page">
				{error && !loading ? (
					<Empty icon="error" title="Failed to load plugins">
						<p>{error}</p>
						<button type="button" className="ghost" onClick={reload}>
							<Icon name="refresh" /> Retry
						</button>
					</Empty>
				) : (
					<p className="muted">
						<Icon name="loading" className="codicon-modifier-spin" /> Loading plugins...
					</p>
				)}
			</div>
		);

	const spin = (key: string, icon: string) => (
		<Icon
			name={busy.includes(key) ? "loading" : icon}
			className={busy.includes(key) ? "codicon-modifier-spin" : ""}
		/>
	);

	if (view === "markets") {
		const add = async () => {
			if (await act("add", call("addMarketplace", source), "Marketplace added")) setSource("");
		};
		return (
			<div className="page plugins">
				<div className="toolbar">
					<button type="button" className="ghost icon-only" onClick={() => setView("catalog")}>
						<Icon name="arrow-left" />
					</button>
					<span className="title">
						<b>Marketplaces</b>
					</span>
				</div>
				{state.marketplaces.map((m: Marketplace) => (
					<div className="market" key={m.name}>
						<Icon name={m.source.includes("/") && !m.source.includes(":") ? "github" : "repo"} />
						<b>{m.name}</b>
						<code className="muted small grow src">{m.source}</code>
						<span className="count">{m.plugins}</span>
						<button
							type="button"
							className="icon-btn"
							title="Update"
							disabled={busy.includes(m.name)}
							onClick={() => act(m.name, call("updateMarketplace", m.name), "Marketplace updated")}
						>
							{spin(m.name, "refresh")}
						</button>
						<button
							type="button"
							className="icon-btn danger"
							title="Remove"
							disabled={busy.includes(m.name)}
							onClick={() => act(m.name, call("removeMarketplace", m.name), "Marketplace removed")}
						>
							<Icon name="trash" />
						</button>
					</div>
				))}
				<div className="toolbar">
					<input
						className="grow"
						value={source}
						placeholder="owner/repo or git URL"
						onChange={(e) => setSource(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && source.trim() && add()}
					/>
					<button
						type="button"
						className="ghost"
						disabled={!source.trim() || busy.includes("add")}
						onClick={add}
					>
						{spin("add", "add")} Add
					</button>
				</div>
			</div>
		);
	}

	if (view === "catalog") {
		const needle = q.toLowerCase();
		const matches = state.catalog.filter(
			(c) =>
				(!filter || c.marketplace === filter) && `${c.name} ${c.description}`.toLowerCase().includes(needle),
		);
		return (
			<div className="page plugins">
				<div className="toolbar">
					<button type="button" className="ghost icon-only" onClick={() => setView("installed")}>
						<Icon name="arrow-left" />
					</button>
					<span className="title">
						<b>Catalog</b>
					</span>
					<span className="count">{state.catalog.length}</span>
					<span className="grow" />
					<button type="button" className="ghost" onClick={() => setView("markets")}>
						<Icon name="repo" /> Marketplaces
					</button>
				</div>
				<div className="toolbar">
					<label className="search">
						<Icon name="search" />
						<input value={q} placeholder="Search plugins" onChange={(e) => setQ(e.target.value)} />
					</label>
				</div>
				<div className="filters">
					{["", ...state.marketplaces.map((m) => m.name)].map((name) => (
						<button
							type="button"
							key={name}
							className={filter === name ? "on" : ""}
							onClick={() => setFilter(name)}
						>
							{name || "All"}
						</button>
					))}
				</div>
				{matches.slice(0, LIMIT).map((c: CatalogEntry) => {
					const id = `${c.name}@${c.marketplace}`;
					return (
						<div className="plug" key={id}>
							<span className="avatar">
								<Icon name="extensions" />
							</span>
							<div className="main">
								<b>
									{c.name}
									<span className="chip">{c.marketplace}</span>
								</b>
								<p className="line">{c.description}</p>
							</div>
							<div className="side">
								{c.installed ? (
									<span className="chip accent">installed</span>
								) : (
									<button
										type="button"
										className="ghost"
										disabled={busy.includes(id)}
										onClick={() => act(id, call("installPlugin", id), "Installed")}
									>
										{spin(id, "cloud-download")} Install
									</button>
								)}
							</div>
						</div>
					);
				})}
				{matches.length > LIMIT && (
					<p className="muted small">
						Showing {LIMIT} of {matches.length} — refine the search
					</p>
				)}
				{!matches.length && <p className="muted">Nothing matches.</p>}
			</div>
		);
	}

	return (
		<div className="page plugins">
			<div className="toolbar">
				<span className="title">
					<b>Installed</b>
				</span>
				<span className="count">{state.installed.length}</span>
				<span className="grow" />
				<button type="button" className="primary" onClick={() => setView("catalog")}>
					<Icon name="add" /> Add
				</button>
			</div>
			{state.installed.length === 0 ? (
				<Empty icon="extensions" title="No plugins installed">
					<p>Plugins add skills, agents, hooks and MCP servers to Claude Code.</p>
				</Empty>
			) : (
				state.installed.map((p: Plugin) => (
					<div className={`plug ${p.enabled ? "" : "off"}`} key={p.id}>
						<span className="avatar">
							<Icon name="extensions" />
						</span>
						<div className="main">
							<b>
								{p.name}
								<span className="chip">v{p.version}</span>
								<span className="chip">{p.marketplace}</span>
							</b>
							<p>{p.description}</p>
							<code className="muted small">{p.id}</code>
						</div>
						<div className="side">
							<input
								type="checkbox"
								className="switch"
								checked={p.enabled}
								disabled={busy.includes(p.id)}
								title={p.enabled ? "Disable" : "Enable"}
								onChange={(e) =>
									act(
										p.id,
										call("setPluginEnabled", p.id, e.target.checked),
										e.target.checked ? "Enabled" : "Disabled",
									)
								}
							/>
							<button
								type="button"
								className="icon-btn danger"
								title="Uninstall"
								disabled={busy.includes(p.id)}
								onClick={() => act(p.id, call("uninstallPlugin", p.id), "Uninstalled")}
							>
								{spin(p.id, "trash")}
							</button>
						</div>
					</div>
				))
			)}
			<div className="muted small">
				<Icon name="info" /> Changes apply to new Claude Code sessions
			</div>
		</div>
	);
}
