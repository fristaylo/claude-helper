import { type CSSProperties, useState } from "react";
import { Avatar } from "../../../components/Avatar/Avatar";
import { Button } from "../../../components/Button/Button";
import { Chip } from "../../../components/Chip/Chip";
import { metaColor } from "../../../components/ColorPicker/ColorPicker";
import { Empty } from "../../../components/Empty/Empty";
import { metaIcon } from "../../../components/IconPicker/IconPicker";
import { Search } from "../../../components/Search/Search";
import type { Scope } from "../../../shared";
import { AgentEditor } from "../AgentEditor/AgentEditor";
import { type Agent, agentName, toolsOf } from "../types";
import styles from "./Agents.module.scss";

export function Agents({ scope, agents }: { scope: Scope; agents: Agent[] }) {
	const [open, setOpen] = useState<{ agent?: Agent }>();
	const [q, setQ] = useState("");

	if (open) return <AgentEditor scope={scope} agent={open.agent} onClose={() => setOpen(undefined)} />;

	const needle = q.toLowerCase();
	const shown = agents.filter((a) =>
		`${agentName(a)} ${a.meta.description ?? ""}`.toLowerCase().includes(needle),
	);

	return (
		<div className="page">
			<div className="toolbar">
				<Search value={q} onChange={setQ} placeholder="Search agents" />
				<span className="grow" />
				<Button variant="primary" icon="add" onClick={() => setOpen({})}>
					New agent
				</Button>
			</div>
			{agents.length === 0 ? (
				<Empty icon="hubot" title={scope === "project" ? "No project agents yet" : "No agents yet"}>
					<p>
						{scope === "project"
							? "Project agents live in this workspace's .claude/agents folder and are available only here. Claude Code delegates tasks to them automatically or when you mention them."
							: "Subagents are specialised assistants with their own prompt, tools and model. Claude Code delegates tasks to them automatically or when you mention them."}
					</p>
					<Button variant="primary" icon="sparkle" onClick={() => setOpen({})}>
						Create your first agent
					</Button>
				</Empty>
			) : (
				<div className={styles.grid}>
					{shown.map((a) => (
						<Card key={a.file} agent={a} onClick={() => setOpen({ agent: a })} />
					))}
					{!shown.length && <p className="muted">Nothing matches “{q}”.</p>}
				</div>
			)}
		</div>
	);
}

function Card({ agent, onClick }: { agent: Agent; onClick: () => void }) {
	const tools = toolsOf(agent.meta);
	return (
		<button
			type="button"
			className={styles.card}
			style={{ "--agent": metaColor(agent.meta) } as CSSProperties}
			onClick={onClick}
		>
			<div className={styles.head}>
				<Avatar icon={metaIcon(agent.meta, "hubot")} />
				<div className={styles.title}>
					<div className={styles.name}>{agentName(agent)}</div>
					<div className={styles.chips}>
						<Chip>{String(agent.meta.model || "inherit")}</Chip>
						{!!agent.meta.effort && <Chip>{String(agent.meta.effort)}</Chip>}
						<Chip>{tools.length ? `${tools.length} tools` : "all tools"}</Chip>
					</div>
				</div>
			</div>
			<p className={styles.desc}>{String(agent.meta.description || "No description").replace(/\\n/g, " ")}</p>
		</button>
	);
}
