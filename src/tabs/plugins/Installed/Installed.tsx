import { Button } from "../../../components/Button/Button";
import { Chip } from "../../../components/Chip/Chip";
import { Count } from "../../../components/Count/Count";
import { Empty } from "../../../components/Empty/Empty";
import { Switch } from "../../../components/Switch/Switch";
import { Icon } from "../../../icons";
import { call } from "../../../rpc";
import { PluginRow } from "../PluginRow/PluginRow";
import type { Act, Spin } from "../Plugins/Plugins";
import type { Plugin } from "../types";

export function Installed({
	plugins,
	busy,
	act,
	spin,
	onAdd,
}: {
	plugins: Plugin[];
	busy: string[];
	act: Act;
	spin: Spin;
	onAdd: () => void;
}) {
	return (
		<div className="page">
			<div className="toolbar">
				<span className="title">
					<b>Installed</b>
				</span>
				<Count>{plugins.length}</Count>
				<span className="grow" />
				<Button variant="primary" icon="add" onClick={onAdd}>
					Add
				</Button>
			</div>
			{plugins.length === 0 ? (
				<Empty icon="extensions" title="No plugins installed">
					<p>Plugins add skills, agents, hooks and MCP servers to Claude Code.</p>
				</Empty>
			) : (
				plugins.map((p) => (
					<PluginRow
						key={p.id}
						off={!p.enabled}
						title={p.name}
						chips={
							<>
								<Chip>v{p.version}</Chip>
								<Chip>{p.marketplace}</Chip>
							</>
						}
						description={p.description}
						meta={<code className="muted small">{p.id}</code>}
						actions={
							<>
								<Switch
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
								<Button
									variant="icon"
									danger
									title="Uninstall"
									disabled={busy.includes(p.id)}
									onClick={() => act(p.id, call("uninstallPlugin", p.id), "Uninstalled")}
								>
									{spin(p.id, "trash")}
								</Button>
							</>
						}
					/>
				))
			)}
			<div className="muted small">
				<Icon name="info" /> Changes apply to new Claude Code sessions
			</div>
		</div>
	);
}
