import { useState } from "react";
import { Chip } from "../../../components/Chip/Chip";
import { ColorPicker, metaColor } from "../../../components/ColorPicker/ColorPicker";
import { Editor } from "../../../components/Editor/Editor";
import { EditorLayout } from "../../../components/EditorLayout/EditorLayout";
import { Field } from "../../../components/Field/Field";
import { IconPicker, metaIcon } from "../../../components/IconPicker/IconPicker";
import { Row, Rows } from "../../../components/Rows/Rows";
import { useDraft } from "../../../hooks/useDraft";
import { Icon } from "../../../icons";
import { call, run } from "../../../rpc";
import { AGENT_NAME, type Scope } from "../../../shared";
import type { Skill } from "../types";

export function SkillEditor({
	scope,
	skill,
	onClose,
}: {
	scope: Scope;
	skill?: Skill;
	onClose: () => void;
}) {
	const [oldName, setOldName] = useState(skill?.name ?? null);
	const {
		draft: form,
		setDraft: setForm,
		dirty,
		markSaved,
	} = useDraft({
		name: skill?.name ?? "",
		description: String(skill?.meta.description ?? ""),
		color: String(skill?.meta.color ?? ""),
		icon: String(skill?.meta.icon ?? ""),
		body: skill?.body ?? "",
	});
	const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
		setForm((f) => ({ ...f, [key]: value }));
	const nameError = !!form.name && !AGENT_NAME.test(form.name);
	const canSave = !!form.name && !nameError && !!form.description.trim();
	const files = skill?.files ?? [];
	const base = scope === "project" ? ".claude/skills" : "skills";

	const save = async () => {
		if (!dirty || !canSave) return;
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
		markSaved(form);
	};
	const remove = async () => {
		if (oldName && (await run(call("deleteSkill", scope, oldName)))) onClose();
	};

	return (
		<EditorLayout
			color={metaColor(form)}
			icon={metaIcon(form, "mortar-board")}
			title={form.name || "New skill"}
			dirty={dirty}
			canSave={canSave}
			onSave={save}
			onBack={onClose}
			backTitle="Back to skills"
			onOpenFile={oldName ? () => run(call("open", scope, `skills/${oldName}/SKILL.md`)) : undefined}
			onDelete={oldName ? remove : undefined}
			fields={
				<>
					<Field
						label="Name"
						error={nameError}
						help={
							nameError
								? "Only lowercase letters, digits and single hyphens"
								: `Saved as ${base}/${form.name || "name"}/SKILL.md${oldName ? ". Renaming renames the folder." : ""}`
						}
					>
						<input
							value={form.name}
							autoFocus={!skill}
							placeholder="release-notes"
							aria-invalid={nameError}
							onChange={(e) => set("name", e.target.value)}
						/>
					</Field>

					<Field label="Description" help="Claude reads this to decide when to use the skill.">
						<textarea
							rows={4}
							value={form.description}
							placeholder="Use when the user asks to prepare release notes from the git history…"
							onChange={(e) => set("description", e.target.value)}
						/>
					</Field>

					<Field label="Color" group>
						<ColorPicker value={form.color} onChange={(v) => set("color", v)} />
					</Field>

					<Field label="Icon" group>
						<IconPicker value={form.icon} onChange={(v) => set("icon", v)} />
					</Field>

					{oldName && files.length > 0 && (
						<Field label="Files" group hint="click to open">
							<Rows>
								<Row icon={<Icon name="markdown" />} title="SKILL.md" trailing={<Chip>edited here</Chip>} />
								{files.map((f) => (
									<Row
										key={f}
										icon={<Icon name={fileIcon(f)} />}
										title={f}
										trailing={<Icon name="go-to-file" />}
										onClick={() => run(call("open", scope, `skills/${oldName}/${f}`))}
									/>
								))}
							</Rows>
						</Field>
					)}
				</>
			}
		>
			<Field label="SKILL.md" grow>
				<Editor
					value={form.body}
					placeholder={"# Release notes\n\n## Steps\n\n1. Read the git log since the last tag\n2. …"}
					onChange={(e) => set("body", e.target.value)}
				/>
			</Field>
		</EditorLayout>
	);
}

function fileIcon(file: string) {
	if (/\.md$/i.test(file)) return "markdown";
	if (/\.(tsx?|jsx?|mjs|cjs|py|sh|ps1|rb|go|rs|json|ya?ml|html|css|scss)$/i.test(file)) return "file-code";
	return "file";
}
