import { type CSSProperties, useState } from "react";
import { Button } from "../../../components/Button/Button";
import { Icon } from "../../../icons";
import { KINDS, KIND_INFO, type Kind } from "../types";
import styles from "./RuleItem.module.scss";

export function RuleItem({
	rule,
	kind,
	disabled,
	onEdit,
	onMove,
	onRemove,
}: {
	rule: string;
	kind: Kind;
	disabled: boolean;
	onEdit: (text: string) => void;
	onMove: (to: Kind) => void;
	onRemove: () => void;
}) {
	const [text, setText] = useState<string>();
	const r = parseRule(rule);

	const commit = () => {
		const value = text?.trim();
		setText(undefined);
		if (value && value !== rule) onEdit(value);
	};

	return (
		<li className={styles.rule} style={{ "--k": KIND_INFO[kind].color } as CSSProperties}>
			<span className={styles.badge}>
				<Icon name={toolIcon(r.tool)} />
				{r.tool}
			</span>
			{text !== undefined ? (
				<input
					className={styles.edit}
					autoFocus
					value={text}
					onChange={(e) => setText(e.target.value)}
					onBlur={commit}
					onKeyDown={(e) => {
						if (e.key === "Enter") commit();
						if (e.key === "Escape") setText(undefined);
					}}
				/>
			) : (
				<code className={styles.spec} title="Click to edit" onClick={() => !disabled && setText(rule)}>
					{r.spec || <span className="muted">any use</span>}
				</code>
			)}
			<span className={styles.actions}>
				{KINDS.filter((k) => k !== kind).map((k) => (
					<Button
						key={k}
						variant="icon"
						icon={KIND_INFO[k].icon}
						color={KIND_INFO[k].color}
						title={`Move to ${KIND_INFO[k].label}`}
						disabled={disabled}
						onClick={() => onMove(k)}
					/>
				))}
				<Button variant="icon" danger icon="trash" title="Remove" disabled={disabled} onClick={onRemove} />
			</span>
		</li>
	);
}

const TOOL_ICONS: Record<string, string> = {
	Bash: "terminal",
	PowerShell: "terminal-powershell",
	Read: "eye",
	Edit: "edit",
	Write: "new-file",
	NotebookEdit: "notebook",
	WebFetch: "globe",
	WebSearch: "search",
	Glob: "files",
	Grep: "search",
	Agent: "hubot",
	Skill: "mortar-board",
};

function parseRule(rule: string) {
	const m = /^([^(]+)\(([\s\S]*)\)$/.exec(rule);
	return m ? { tool: m[1], spec: m[2] } : { tool: rule, spec: "" };
}

const toolIcon = (tool: string) => TOOL_ICONS[tool] ?? (tool.startsWith("mcp__") ? "plug" : "tools");
