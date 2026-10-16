import { useState } from "react";
import { Button } from "../../../components/Button/Button";
import type { Kind } from "../types";
import styles from "./RuleBuilder.module.scss";

const BUILDER: Record<string, string> = {
	Bash: "git push:*",
	PowerShell: "Remove-Item:*",
	Read: "./secrets/**",
	Edit: "/etc/**",
	Write: "*.env",
	WebFetch: "domain:example.com",
	WebSearch: "",
	Glob: "",
	Grep: "",
	Agent: "Explore",
	Skill: "publish",
	NotebookEdit: "",
};
const RAW = "Custom";

const ADD_COLOR: Record<Kind, string> = {
	deny: "var(--deny)",
	ask: "color-mix(in srgb, var(--ask) 85%, #000)",
	allow: "var(--allow)",
};

export function RuleBuilder({
	kind,
	disabled,
	onAdd,
}: {
	kind: Kind;
	disabled: boolean;
	onAdd: (rule: string) => Promise<boolean>;
}) {
	const [tool, setTool] = useState("Bash");
	const [spec, setSpec] = useState("");

	const add = async () => {
		const s = spec.trim();
		const rule = tool === RAW ? s : s ? `${tool}(${s})` : tool;
		if (rule && (await onAdd(rule))) setSpec("");
	};

	return (
		<div className={styles.builder}>
			<select value={tool} onChange={(e) => setTool(e.target.value)}>
				{[...Object.keys(BUILDER), RAW].map((t) => (
					<option key={t}>{t}</option>
				))}
			</select>
			<div className={styles.input}>
				{tool !== RAW && <span className={styles.affix}>{tool}(</span>}
				<input
					value={spec}
					disabled={disabled}
					placeholder={tool === RAW ? "mcp__server__tool" : BUILDER[tool] || "empty = any use"}
					onChange={(e) => setSpec(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && add()}
				/>
				{tool !== RAW && <span className={styles.affix}>)</span>}
			</div>
			<Button variant="primary" icon="add" color={ADD_COLOR[kind]} disabled={disabled} onClick={add}>
				Add
			</Button>
		</div>
	);
}
