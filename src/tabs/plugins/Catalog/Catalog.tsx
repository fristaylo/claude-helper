import { Button } from "../../../components/Button/Button";
import { Chip } from "../../../components/Chip/Chip";
import { Count } from "../../../components/Count/Count";
import { Filters } from "../../../components/Filters/Filters";
import { Search } from "../../../components/Search/Search";
import { call } from "../../../rpc";
import { PluginRow } from "../PluginRow/PluginRow";
import type { Act, Spin } from "../Plugins/Plugins";
import type { PluginsState } from "../types";

const LIMIT = 100;

export function Catalog({
	state,
	busy,
	act,
	spin,
	q,
	onQ,
	filter,
	onFilter,
	onBack,
	onMarkets,
}: {
	state: PluginsState;
	busy: string[];
	act: Act;
	spin: Spin;
	q: string;
	onQ: (v: string) => void;
	filter: string;
	onFilter: (v: string) => void;
	onBack: () => void;
	onMarkets: () => void;
}) {
	const needle = q.toLowerCase();
	const matches = state.catalog.filter(
		(c) =>
			(!filter || c.marketplace === filter) && `${c.name} ${c.description}`.toLowerCase().includes(needle),
	);
	return (
		<div className="page">
			<div className="toolbar">
				<Button variant="ghost" iconOnly icon="arrow-left" onClick={onBack} />
				<span className="title">
					<b>Catalog</b>
				</span>
				<Count>{state.catalog.length}</Count>
				<span className="grow" />
				<Button variant="ghost" icon="repo" onClick={onMarkets}>
					Marketplaces
				</Button>
			</div>
			<div className="toolbar">
				<Search value={q} onChange={onQ} placeholder="Search plugins" />
			</div>
			<Filters
				options={["", ...state.marketplaces.map((m) => m.name)].map((name) => ({
					value: name,
					label: name || "All",
				}))}
				value={filter}
				onChange={onFilter}
			/>
			{matches.slice(0, LIMIT).map((c) => {
				const id = `${c.name}@${c.marketplace}`;
				return (
					<PluginRow
						key={id}
						line
						title={c.name}
						chips={<Chip>{c.marketplace}</Chip>}
						description={c.description}
						actions={
							c.installed ? (
								<Chip accent>installed</Chip>
							) : (
								<Button
									variant="ghost"
									disabled={busy.includes(id)}
									onClick={() => act(id, call("installPlugin", id), "Installed")}
								>
									{spin(id, "cloud-download")} Install
								</Button>
							)
						}
					/>
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
