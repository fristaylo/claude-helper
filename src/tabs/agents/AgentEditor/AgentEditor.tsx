import { useState } from "react";
import { Button } from "../../../components/Button/Button";
import { ColorPicker, metaColor } from "../../../components/ColorPicker/ColorPicker";
import { Editor } from "../../../components/Editor/Editor";
import { EditorLayout } from "../../../components/EditorLayout/EditorLayout";
import { Field } from "../../../components/Field/Field";
import { IconPicker, metaIcon } from "../../../components/IconPicker/IconPicker";
import { Segmented } from "../../../components/Segmented/Segmented";
import { useDraft } from "../../../hooks/useDraft";
import { Icon } from "../../../icons";
import { call, run } from "../../../rpc";
import { AGENT_NAME, EFFORTS, type Meta, type Scope } from "../../../shared";
import { type Agent, agentName, toolsOf } from "../types";
import styles from "./AgentEditor.module.scss";

const MODELS = ["inherit", "sonnet", "opus", "haiku"];
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

export function AgentEditor({
	scope,
	agent,
	onClose,
}: {
	scope: Scope;
	agent?: Agent;
	onClose: () => void;
}) {
	const [file, setFile] = useState(agent?.file ?? null);
	const {
		draft: form,
		setDraft: setForm,
		dirty,
		markSaved,
	} = useDraft({
		name: agent ? agentName(agent) : "",
		description: String(agent?.meta.description ?? ""),
		model: String(agent?.meta.model || "inherit"),
		color: String(agent?.meta.color ?? ""),
		icon: String(agent?.meta.icon ?? ""),
		effort: String(agent?.meta.effort ?? ""),
		tools: agent ? toolsOf(agent.meta) : [],
		prompt: agent?.prompt ?? "",
	});
	const [customTool, setCustomTool] = useState("");
	const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
		setForm((f) => ({ ...f, [key]: value }));
	const toggleTool = (t: string) =>
		set("tools", form.tools.includes(t) ? form.tools.filter((x) => x !== t) : [...form.tools, t]);
	const nameError = !!form.name && !AGENT_NAME.test(form.name);
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
		const next = await run(call("saveAgent", scope, file, meta, form.prompt), `Agent “${form.name}” saved`);
		if (!next) return;
		setFile(next);
		markSaved(form);
	};
	const remove = async () => {
		if (file && (await run(call("deleteAgent", scope, file)))) onClose();
	};
	const addCustom = () => {
		const t = customTool.trim();
		if (t && !form.tools.includes(t)) set("tools", [...form.tools, t]);
		setCustomTool("");
	};

	return (
		<EditorLayout
			color={metaColor(form)}
			icon={metaIcon(form, "hubot")}
			title={form.name || "New agent"}
			dirty={dirty}
			canSave={!!form.name && !nameError && !!form.description.trim()}
			onSave={save}
			onBack={onClose}
			backTitle="Back to agents"
			onOpenFile={file ? () => run(call("open", scope, `agents/${file}`)) : undefined}
			onDelete={file ? remove : undefined}
			fields={
				<>
					<Field
						label="Name"
						error={nameError}
						help={
							nameError
								? "Only lowercase letters, digits and single hyphens"
								: `Saved as ${scope === "project" ? ".claude/" : ""}agents/${form.name || "name"}.md`
						}
					>
						<input
							value={form.name}
							autoFocus={!agent}
							placeholder="code-reviewer"
							aria-invalid={nameError}
							onChange={(e) => set("name", e.target.value)}
						/>
					</Field>

					<Field label="Description" help="Claude reads this to decide when to delegate to the agent.">
						<textarea
							rows={4}
							value={form.description}
							placeholder="Use this agent after writing code to review it for bugs and style…"
							onChange={(e) => set("description", e.target.value)}
						/>
					</Field>

					<Field label="Model" group>
						<Segmented
							color="var(--agent)"
							value={form.model}
							onChange={(v) => set("model", v)}
							options={models.map((m) => ({ value: m, label: m }))}
						/>
					</Field>

					<Field label="Effort" group>
						<Segmented
							color="var(--agent)"
							value={form.effort}
							onChange={(v) => set("effort", v)}
							options={efforts.map((e) => ({ value: e, label: e || "inherit" }))}
						/>
					</Field>

					<Field label="Color" group>
						<ColorPicker value={form.color} onChange={(c) => set("color", c)} />
					</Field>

					<Field label="Icon" group>
						<IconPicker value={metaIcon(form, "hubot")} onChange={(i) => set("icon", i)} />
					</Field>

					<Field
						label="Tools"
						group
						hint={form.tools.length ? `${form.tools.length} selected` : "inherits all tools"}
					>
						<div className={styles.tools}>
							{[...TOOLS, ...form.tools.filter((t) => !TOOLS.includes(t))].map((t) => (
								<button
									type="button"
									key={t}
									className={`${styles.toggle} ${form.tools.includes(t) ? styles.on : ""}`}
									onClick={() => toggleTool(t)}
								>
									{form.tools.includes(t) && <Icon name="check" />}
									{t}
								</button>
							))}
						</div>
						<div className={styles.inlineAdd}>
							<input
								value={customTool}
								placeholder="Other tool, e.g. mcp__github__create_issue"
								onChange={(e) => setCustomTool(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && addCustom()}
							/>
							<Button variant="ghost" icon="add" disabled={!customTool.trim()} onClick={addCustom} />
							{form.tools.length > 0 && (
								<Button variant="ghost" onClick={() => set("tools", [])}>
									All tools
								</Button>
							)}
						</div>
					</Field>
				</>
			}
		>
			<Field label="System prompt" grow>
				<Editor
					value={form.prompt}
					placeholder={
						"You are a senior code reviewer. When invoked:\n1. Run git diff to see recent changes\n2. …"
					}
					onChange={(e) => set("prompt", e.target.value)}
				/>
			</Field>
		</EditorLayout>
	);
}
