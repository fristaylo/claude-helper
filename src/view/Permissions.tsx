import { useState } from "react";
import { KINDS, type Kind, type Rules } from "../shared";
import { call, run, toast } from "./rpc";
import { Empty, Icon, Segmented } from "./ui";

const INFO: Record<Kind, { label: string; icon: string; hint: string }> = {
	deny: { label: "Deny", icon: "circle-slash", hint: "Always blocked, even if allowed somewhere else." },
	ask: { label: "Ask", icon: "question", hint: "Claude asks for confirmation every time." },
	allow: { label: "Allow", icon: "pass", hint: "Runs without asking." },
};

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

export function Permissions({ rules, error }: { rules: Rules; error?: string }) {
	const [kind, setKind] = useState<Kind>("deny");
	const [q, setQ] = useState("");
	const [tool, setTool] = useState("Bash");
	const [spec, setSpec] = useState("");
	const [editing, setEditing] = useState<{ rule: string; text: string }>();
	const list = rules[kind];
	const needle = q.toLowerCase();
	const shown = list.filter((r) => r.toLowerCase().includes(needle));

	const apply = (patch: Partial<Rules>, ok?: string) => run(call("setRules", patch), ok);

	const add = async () => {
		const s = spec.trim();
		const rule = tool === RAW ? s : s ? `${tool}(${s})` : tool;
		if (!rule) return;
		const owner = KINDS.find((k) => rules[k].includes(rule));
		if (owner) return toast(`Already in ${INFO[owner].label}`, true);
		await apply({ [kind]: [...list, rule] }, `Added to ${INFO[kind].label}`);
		setSpec("");
	};
	const move = (rule: string, to: Kind) =>
		apply(
			{ [kind]: list.filter((r) => r !== rule), [to]: [...rules[to], rule] },
			`Moved to ${INFO[to].label}`,
		);
	const remove = (rule: string) => apply({ [kind]: list.filter((r) => r !== rule) }, "Rule removed");
	const commitEdit = async () => {
		if (!editing) return;
		const text = editing.text.trim();
		setEditing(undefined);
		if (text && text !== editing.rule)
			await apply({ [kind]: list.map((r) => (r === editing.rule ? text : r)) });
	};

	return (
		<div className="page permissions">
			<div className="toolbar">
				<Segmented
					value={kind}
					onChange={(k) => {
						setKind(k);
						setEditing(undefined);
					}}
					options={KINDS.map((k) => ({
						value: k,
						icon: INFO[k].icon,
						className: `kind-${k}`,
						label: (
							<>
								{INFO[k].label}
								<span className="count">{rules[k].length}</span>
							</>
						),
					}))}
				/>
				<span className="grow" />
				<button type="button" className="ghost" onClick={() => run(call("open", "settings.json"))}>
					<Icon name="json" /> settings.json
				</button>
			</div>

			{error && (
				<div className="banner error">
					<Icon name="error" /> {error}
				</div>
			)}

			<p className={`kind-hint kind-${kind}`}>
				<Icon name={INFO[kind].icon} /> {INFO[kind].hint}
			</p>

			<div className="rule-builder">
				<select value={tool} onChange={(e) => setTool(e.target.value)}>
					{[...Object.keys(BUILDER), RAW].map((t) => (
						<option key={t}>{t}</option>
					))}
				</select>
				<div className="rule-input">
					{tool !== RAW && <span className="affix">{tool}(</span>}
					<input
						value={spec}
						disabled={!!error}
						placeholder={tool === RAW ? "mcp__server__tool" : BUILDER[tool] || "empty = any use"}
						onChange={(e) => setSpec(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && add()}
					/>
					{tool !== RAW && <span className="affix">)</span>}
				</div>
				<button type="button" className={`primary kind-${kind}`} disabled={!!error} onClick={add}>
					<Icon name="add" /> Add
				</button>
			</div>

			{list.length > 4 && (
				<label className="search">
					<Icon name="filter" />
					<input
						value={q}
						placeholder={`Filter ${list.length} rules`}
						onChange={(e) => setQ(e.target.value)}
					/>
				</label>
			)}

			{list.length === 0 ? (
				<Empty icon={INFO[kind].icon} title={`No ${INFO[kind].label.toLowerCase()} rules`}>
					<p>
						Rules look like <code>Bash(npm run test:*)</code>, <code>Read(./.env)</code> or just{" "}
						<code>WebSearch</code>.
					</p>
				</Empty>
			) : (
				<ul className="rules">
					{shown.map((rule) => {
						const r = parseRule(rule);
						return (
							<li key={rule} className={`rule kind-${kind}`}>
								<span className="tool-badge">
									<Icon name={toolIcon(r.tool)} />
									{r.tool}
								</span>
								{editing?.rule === rule ? (
									<input
										className="rule-edit"
										autoFocus
										value={editing.text}
										onChange={(e) => setEditing({ rule, text: e.target.value })}
										onBlur={commitEdit}
										onKeyDown={(e) => {
											if (e.key === "Enter") commitEdit();
											if (e.key === "Escape") setEditing(undefined);
										}}
									/>
								) : (
									<code
										className="spec"
										title="Click to edit"
										onClick={() => !error && setEditing({ rule, text: rule })}
									>
										{r.spec || <span className="muted">any use</span>}
									</code>
								)}
								<span className="actions">
									{KINDS.filter((k) => k !== kind).map((k) => (
										<button
											type="button"
											key={k}
											className={`icon-btn kind-${k}`}
											title={`Move to ${INFO[k].label}`}
											disabled={!!error}
											onClick={() => move(rule, k)}
										>
											<Icon name={INFO[k].icon} />
										</button>
									))}
									<button
										type="button"
										className="icon-btn danger"
										title="Remove"
										disabled={!!error}
										onClick={() => remove(rule)}
									>
										<Icon name="trash" />
									</button>
								</span>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
