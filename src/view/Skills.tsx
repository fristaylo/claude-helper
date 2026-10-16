import { useState } from "react";
import { AGENT_NAME, type Scope, type Skill } from "../shared";
import { call, onSaveKey, run } from "./rpc";
import { ColorPicker, Empty, Icon, IconPicker, metaColor, metaIcon } from "./ui";

export function Skills({ scope, skills }: { scope: Scope; skills: Skill[] }) {
	const [open, setOpen] = useState<{ skill?: Skill }>();
	const [q, setQ] = useState("");

	if (open) return <SkillEditor scope={scope} skill={open.skill} onClose={() => setOpen(undefined)} />;

	const needle = q.toLowerCase();
	const shown = skills.filter((s) =>
		`${skillName(s)} ${s.meta.description ?? ""}`.toLowerCase().includes(needle),
	);

	return (
		<div className="page skills">
			<div className="toolbar">
				<label className="search">
					<Icon name="search" />
					<input value={q} placeholder="Search skills" onChange={(e) => setQ(e.target.value)} />
				</label>
				<span className="grow" />
				<button type="button" className="primary" onClick={() => setOpen({})}>
					<Icon name="add" /> New skill
				</button>
			</div>
			{skills.length === 0 ? (
				<Empty icon="mortar-board" title="No skills yet">
					<p>
						Skills are folders with a SKILL.md that Claude loads when its description matches the task.
						{scope === "project"
							? " Skills of this project live in its .claude/skills folder."
							: " Global skills live in ~/.claude/skills and are available in every project."}
					</p>
					<button type="button" className="primary" onClick={() => setOpen({})}>
						<Icon name="sparkle" /> Create your first skill
					</button>
				</Empty>
			) : (
				<div className="rows">
					{shown.map((s) => (
						<button
							type="button"
							key={s.name}
							className="row"
							style={{ "--agent": metaColor(s.meta) } as React.CSSProperties}
							onClick={() => setOpen({ skill: s })}
						>
							<span className="avatar small">
								<Icon name={metaIcon(s.meta, "mortar-board")} />
							</span>
							<span className="main">
								<b>{skillName(s)}</b>
								<span>{String(s.meta.description ?? "")}</span>
							</span>
							<span className="chip" title="Files in the skill folder">
								{s.files.length + 1}
							</span>
						</button>
					))}
					{!shown.length && <p className="muted row-empty">Nothing matches “{q}”.</p>}
				</div>
			)}
		</div>
	);
}

function SkillEditor({ scope, skill, onClose }: { scope: Scope; skill?: Skill; onClose: () => void }) {
	const [oldName, setOldName] = useState(skill?.name ?? null);
	const [form, setForm] = useState(() => ({
		name: skill?.name ?? "",
		description: String(skill?.meta.description ?? ""),
		color: String(skill?.meta.color ?? ""),
		icon: String(skill?.meta.icon ?? ""),
		body: skill?.body ?? "",
	}));
	const [saved, setSaved] = useState(() => JSON.stringify(form));
	const [leaving, setLeaving] = useState(false);
	const dirty = JSON.stringify(form) !== saved;
	const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
		setForm((f) => ({ ...f, [key]: value }));
	const nameError = form.name && !AGENT_NAME.test(form.name);
	const files = skill?.files ?? [];
	const base = scope === "project" ? ".claude/skills" : "skills";

	const save = async () => {
		if (!dirty || !form.name || nameError || !form.description.trim()) return;
		const meta = {
			...skill?.meta,
			name: form.name,
			description: form.description,
			icon: form.icon,
			color: form.color,
		};
		const next = await run(call("saveSkill", scope, oldName, meta, form.body), `Skill “${form.name}” saved`);
		if (!next) return;
		setOldName(next);
		setSaved(JSON.stringify(form));
	};
	const remove = async () => {
		if (oldName && (await run(call("deleteSkill", scope, oldName)))) onClose();
	};

	return (
		<div
			className="page editor-page"
			style={{ "--agent": metaColor(form) } as React.CSSProperties}
			onKeyDown={onSaveKey(save)}
		>
			<div className="toolbar">
				<button
					type="button"
					className="ghost icon-only"
					title="Back to skills"
					onClick={() => (dirty ? setLeaving(true) : onClose())}
				>
					<Icon name="arrow-left" />
				</button>
				<span className="avatar small">
					<Icon name={metaIcon(form, "mortar-board")} />
				</span>
				<h2 className="title">{form.name || "New skill"}</h2>
				{dirty && <span className="dot" title="Unsaved changes" />}
				<span className="grow" />
				{oldName && (
					<>
						<button
							type="button"
							className="ghost"
							onClick={() => run(call("open", scope, `skills/${oldName}/SKILL.md`))}
						>
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
							autoFocus={!skill}
							placeholder="release-notes"
							className={nameError ? "invalid" : ""}
							onChange={(e) => set("name", e.target.value)}
						/>
						<span className={`help ${nameError ? "error" : ""}`}>
							{nameError
								? "Only lowercase letters, digits and single hyphens"
								: `Saved as ${base}/${form.name || "name"}/SKILL.md${oldName ? ". Renaming renames the folder." : ""}`}
						</span>
					</label>

					<label className="field">
						<span className="label">Description</span>
						<textarea
							rows={4}
							value={form.description}
							placeholder="Use when the user asks to prepare release notes from the git history…"
							onChange={(e) => set("description", e.target.value)}
						/>
						<span className="help">Claude reads this to decide when to use the skill.</span>
					</label>

					<div className="field">
						<span className="label">Color</span>
						<ColorPicker value={form.color} onChange={(v) => set("color", v)} />
					</div>

					<div className="field">
						<span className="label">Icon</span>
						<IconPicker value={form.icon} onChange={(v) => set("icon", v)} />
					</div>

					{oldName && files.length > 0 && (
						<div className="field">
							<span className="label">
								Files
								<span className="muted small">click to open</span>
							</span>
							<div className="rows">
								<div className="row static">
									<Icon name="markdown" />
									<span className="main">
										<b>SKILL.md</b>
									</span>
									<span className="chip">edited here</span>
								</div>
								{files.map((f) => (
									<button
										type="button"
										key={f}
										className="row"
										onClick={() => run(call("open", scope, `skills/${oldName}/${f}`))}
									>
										<Icon name={fileIcon(f)} />
										<span className="main">
											<b>{f}</b>
										</span>
										<Icon name="go-to-file" />
									</button>
								))}
							</div>
						</div>
					)}
				</div>

				<label className="field prompt">
					<span className="label">SKILL.md</span>
					<textarea
						className="editor"
						value={form.body}
						spellCheck={false}
						placeholder={"# Release notes\n\n## Steps\n\n1. Read the git log since the last tag\n2. …"}
						onChange={(e) => set("body", e.target.value)}
					/>
				</label>
			</div>
		</div>
	);
}

const skillName = (s: Skill) => String(s.meta.name || s.name);

function fileIcon(file: string) {
	if (/\.md$/i.test(file)) return "markdown";
	if (/\.(tsx?|jsx?|mjs|cjs|py|sh|ps1|rb|go|rs|json|ya?ml|html|css|scss)$/i.test(file)) return "file-code";
	return "file";
}
