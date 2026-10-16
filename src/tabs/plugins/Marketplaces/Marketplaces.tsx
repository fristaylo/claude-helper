import { Button } from "../../../components/Button/Button";
import { Count } from "../../../components/Count/Count";
import { Icon } from "../../../icons";
import { call } from "../../../rpc";
import type { Act, Spin } from "../Plugins/Plugins";
import type { Marketplace } from "../types";
import styles from "./Marketplaces.module.scss";

export function Marketplaces({
	markets,
	busy,
	act,
	spin,
	source,
	onSource,
	onBack,
}: {
	markets: Marketplace[];
	busy: string[];
	act: Act;
	spin: Spin;
	source: string;
	onSource: (v: string) => void;
	onBack: () => void;
}) {
	const add = async () => {
		if (await act("add", call("addMarketplace", source), "Marketplace added")) onSource("");
	};
	return (
		<div className="page">
			<div className="toolbar">
				<Button variant="ghost" iconOnly icon="arrow-left" onClick={onBack} />
				<span className="title">
					<b>Marketplaces</b>
				</span>
			</div>
			{markets.map((m) => (
				<div className={styles.market} key={m.name}>
					<Icon name={m.source.includes("/") && !m.source.includes(":") ? "github" : "repo"} />
					<b>{m.name}</b>
					<code className={`muted small grow ${styles.src}`}>{m.source}</code>
					<Count>{m.plugins}</Count>
					<Button
						variant="icon"
						title="Update"
						disabled={busy.includes(m.name)}
						onClick={() => act(m.name, call("updateMarketplace", m.name), "Marketplace updated")}
					>
						{spin(m.name, "refresh")}
					</Button>
					<Button
						variant="icon"
						danger
						title="Remove"
						disabled={busy.includes(m.name)}
						onClick={() => act(m.name, call("removeMarketplace", m.name), "Marketplace removed")}
					>
						<Icon name="trash" />
					</Button>
				</div>
			))}
			<div className="toolbar">
				<input
					className="grow"
					value={source}
					placeholder="owner/repo or git URL"
					onChange={(e) => onSource(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && source.trim() && add()}
				/>
				<Button variant="ghost" disabled={!source.trim() || busy.includes("add")} onClick={add}>
					{spin("add", "add")} Add
				</Button>
			</div>
		</div>
	);
}
