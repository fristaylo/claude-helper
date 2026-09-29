import { useState } from "react";
import { AGENT_NAME, type Agent, EFFORTS, type Meta } from "../shared";
import { call, onSaveKey, run } from "./rpc";
import { Empty, Icon, Segmented } from "./ui";

const COLORS: Record<string, string> = {
	red: "#e5534b",
	orange: "#e0823d",
	yellow: "#d4a72c",
	green: "#57ab5a",
	cyan: "#39c5cf",
	blue: "#539bf5",
	purple: "#b083f0",
	pink: "#e275ad",
};
const MODELS = ["inherit", "sonnet", "opus", "haiku"];
const ICONS = [
	"hubot",
	"robot",
	"rocket",
	"beaker",
	"bug",
	"code",
	"terminal",
	"tools",
	"book",
	"search",
	"shield",
	"lock",
	"zap",
	"flame",
	"lightbulb",
	"eye",
	"checklist",
	"git-merge",
	"database",
	"cloud",
	"globe",
	"paintcan",
	"telescope",
	"mortar-board",
];
const TOOLS = [
	"Read",
	"Write",
	"Edit",
	"Glob",
	"Grep",
	"Bash",
	"PowerShell",
	"WebFetch",
	"WebSearch",
	"Agent",
	"Skill",
	"TodoWrite",
	"NotebookEdit",
];

const agentName = (a: Agent) => String(a.meta.name || a.file.replace(/\.md$/, ""));
const agentColor = (meta: Meta) => COLORS[String(meta.color)] ?? "var(--accent)";
const agentIcon = (meta: Meta) => (ICONS.includes(String(meta.icon)) ? String(meta.icon) : "hubot");
const toolsOf = (meta: Meta) => {
	const t = meta.tools;
	if (Array.isArray(t)) return t.map(String);
	return typeof t === "string"
		? t
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean)
		: [];
};

export function Agents({ agents }: { agents: Agent[] }) {
	const [open, setOpen] = useState<{ agent?: Agent }>();
	const [q, setQ] = useState("");

	if (open) return <AgentEditor agent={open.agent} onClose={() => setOpen(undefined)} />;

	const needle = q.toLowerCase();
	const shown = agents.filter((a) =>
		`${agentName(a)} ${a.meta.description ?? ""}`.toLowerCase().includes(needle),
	);

	return (
		<div className="page agents">
			<div className="toolbar">
				<label className="search">
					<Icon name="search" />
					<input value={q} placeholder="Search agents" onChange={(e) => setQ(e.target.value)} />
				</label>
				<span className="grow" />
				<button type="button" className="primary" onClick={() => setOpen({})}>
					<Icon name="add" /> New agent
				</button>
			</div>
			{agents.length === 0 ? (
				<Empty icon="hubot" title="No agents yet">
					<p>
						Subagents are specialised assistants with their own prompt, tools and model. Claude Code delegates
						tasks to them automatically or when you mention them.
					</p>
					<button type="button" className="primary" onClick={() => setOpen({})}>
						<Icon name="sparkle" /> Create your first agent
					</button>
				</Empty>
			) : (
				<div className="grid">
					{shown.map((a) => {
						const tools = toolsOf(a.meta);
						return (
							<button
								type="button"
								key={a.file}
								className="card"
								style={{ "--agent": agentColor(a.meta) } as React.CSSProperties}
								onClick={() => setOpen({ agent: a })}
							>
								<div className="card-head">
									<span className="avatar">
										<Icon name={agentIcon(a.meta)} />
									</span>
									<div className="card-title">
										<div className="name">{agentName(a)}</div>
										<div className="chips">
											<span className="chip">{String(a.meta.model || "inherit")}</span>
											{!!a.meta.effort && <span className="chip">{String(a.meta.effort)}</span>}
											<span className="chip">{tools.length ? `${tools.length} tools` : "all tools"}</span>
										</div>
									</div>
								</div>
								<p className="desc">{String(a.meta.description || "No description").replace(/\\n/g, " ")}</p>
							</button>
						);
					})}
					{!shown.length && <p className="muted">Nothing matches “{q}”.</p>}
				</div>
			)}
		</div>
	);
}

function AgentEditor({ agent, onClose }: { agent?: Agent; onClose: () => void }) {
	const [file, setFile] = useState(agent?.file ?? null);
	const [form, setForm] = useState(() => ({
		name: agent ? agentName(agent) : "",
		description: String(agent?.meta.description ?? ""),
		model: String(agent?.meta.model || "inherit"),
		color: String(agent?.meta.color ?? ""),
		icon: String(agent?.meta.icon ?? ""),
		effort: String(agent?.meta.effort ?? ""),
		tools: agent ? toolsOf(agent.meta) : [],
		prompt: agent?.prompt ?? "",
	}));
	const [saved, setSaved] = useState(() => JSON.stringify(form));
	const [leaving, setLeaving] = useState(false);
	const [customTool, setCustomTool] = useState("");
	const dirty = JSON.stringify(form) !== saved;
	const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
		setForm((f) => ({ ...f, [key]: value }));
	const toggleTool = (t: string) =>
		set("tools", form.tools.includes(t) ? form.tools.filter((x) => x !== t) : [...form.tools, t]);
	const nameError = form.name && !AGENT_NAME.test(form.name);
	const models = MODELS.includes(form.model) ? MODELS : [...MODELS, form.model];
	const efforts = ["", ...EFFORTS];
	if (!efforts.includes(form.effort)) efforts.push(form.effort);

	const save = async () => {
		const meta: Meta = {
			...agent?.meta,
			name: form.name,
			description: form.description,
			tools: form.tools.join(", "),
			model: form.model,
			color: form.color,
			icon: form.icon,
			effort: form.effort,
		};
		const next = await run(call("saveAgent", file, meta, form.prompt), `Agent “${form.name}” saved`);
		if (!next) return;
		setFile(next);
		setSaved(JSON.stringify(form));
	};
	const remove = async () => {
		if (file && (await run(call("deleteAgent", file)))) onClose();
	};
	const addCustom = () => {
		const t = customTool.trim();
		if (t && !form.tools.includes(t)) set("tools", [...form.tools, t]);
		setCustomTool("");
	};

	return (
		<div
			className="page editor-page"
			style={{ "--agent": agentColor(form) } as React.CSSProperties}
			onKeyDown={onSaveKey(save)}
		>
			<div className="toolbar">
				<button
					type="button"
					className="ghost icon-only"
					title="Back to agents"
					onClick={() => (dirty ? setLeaving(true) : onClose())}
				>
					<Icon name="arrow-left" />
				</button>
				<span className="avatar small">
					<Icon name={agentIcon(form)} />
				</span>
				<h2 className="title">{form.name || "New agent"}</h2>
				{dirty && <span className="dot" title="Unsaved changes" />}
				<span className="grow" />
				{file && (
					<>
						<button type="button" className="ghost" onClick={() => run(call("open", `agents/${file}`))}>
							<Icon name="go-to-file" /> File
						</button>
						<button type="button" className="ghost danger" onClick={remove}>
							<Icon name="trash" /> Delete
						</button>
					</>
				)}
				<button
					type="button"
					className="primary"
					disabled={!dirty || !form.name || !!nameError || !form.description.trim()}
					onClick={save}
				>
					<Icon name="save" /> Save
				</button>
			</div>

			{leaving && (
				<div className="banner warn">
					<Icon name="warning" /> You have unsaved changes.
					<span className="grow" />
					<button type="button" className="ghost" onClick={() => setLeaving(false)}>
						Keep editing
					</button>
					<button type="button" className="ghost danger" onClick={onClose}>
						Discard
					</button>
				</div>
			)}

			<div className="editor-grid">
				<div className="fields">
					<label className="field">
						<span className="label">Name</span>
						<input
							value={form.name}
							autoFocus={!agent}
							placeholder="code-reviewer"
							className={nameError ? "invalid" : ""}
							onChange={(e) => set("name", e.target.value)}
						/>
						<span className={`help ${nameError ? "error" : ""}`}>
							{nameError
								? "Only lowercase letters, digits and single hyphens"
								: `Saved as agents/${form.name || "name"}.md`}
						</span>
					</label>

					<label className="field">
						<span className="label">Description</span>
						<textarea
							rows={4}
							value={form.description}
							placeholder="Use this agent after writing code to review it for bugs and style…"
							onChange={(e) => set("description", e.target.value)}
						/>
						<span className="help">Claude reads this to decide when to delegate to the agent.</span>
					</label>

					<div className="field">
						<span className="label">Model</span>
						<Segmented
							value={form.model}
							onChange={(v) => set("model", v)}
							options={models.map((m) => ({ value: m, label: m }))}
						/>
					</div>

					<div className="field">
						<span className="label">Effort</span>
						<Segmented
							value={form.effort}
							onChange={(v) => set("effort", v)}
							options={efforts.map((e) => ({ value: e, label: e || "inherit" }))}
						/>
					</div>

					<div className="field">
						<span className="label">Color</span>
						<div className="swatches">
							<button
								type="button"
								title="No color"
								className={`swatch none ${form.color ? "" : "on"}`}
								onClick={() => set("color", "")}
							>
								<Icon name="circle-slash" />
							</button>
							{Object.entries(COLORS).map(([c, hex]) => (
								<button
									type="button"
									key={c}
									title={c}
									className={`swatch ${form.color === c ? "on" : ""}`}
									style={{ background: hex }}
									onClick={() => set("color", c)}
								/>
							))}
						</div>
					</div>

					<div className="field">
						<span className="label">Icon</span>
						<div className="swatches">
							{ICONS.map((i) => (
								<button
									type="button"
									key={i}
									title={i}
									className={`swatch glyph ${agentIcon(form) === i ? "on" : ""}`}
									onClick={() => set("icon", i)}
								>
									<Icon name={i} />
								</button>
							))}
						</div>
					</div>

					<div className="field">
						<span className="label">
							Tools
							<span className="muted small">
								{form.tools.length ? `${form.tools.length} selected` : "inherits all tools"}
							</span>
						</span>
						<div className="tool-chips">
							{[...TOOLS, ...form.tools.filter((t) => !TOOLS.includes(t))].map((t) => (
								<button
									type="button"
									key={t}
									className={`toggle ${form.tools.includes(t) ? "on" : ""}`}
									onClick={() => toggleTool(t)}
								>
									{form.tools.includes(t) && <Icon name="check" />}
									{t}
								</button>
							))}
						</div>
						<div className="inline-add">
							<input
								value={customTool}
								placeholder="Other tool, e.g. mcp__github__create_issue"
								onChange={(e) => setCustomTool(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && addCustom()}
							/>
							<button type="button" className="ghost" disabled={!customTool.trim()} onClick={addCustom}>
								<Icon name="add" />
							</button>
							{form.tools.length > 0 && (
								<button type="button" className="ghost" onClick={() => set("tools", [])}>
									All tools
								</button>
							)}
						</div>
					</div>
				</div>

				<label className="field prompt">
					<span className="label">System prompt</span>
					<textarea
						className="editor"
						value={form.prompt}
						spellCheck={false}
						placeholder={
							"You are a senior code reviewer. When invoked:\n1. Run git diff to see recent changes\n2. …"
						}
						onChange={(e) => set("prompt", e.target.value)}
					/>
				</label>
			</div>
		</div>
	);
}
