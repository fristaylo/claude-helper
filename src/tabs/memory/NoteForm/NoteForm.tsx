import { Button } from "../../../components/Button/Button";
import { Editor } from "../../../components/Editor/Editor";
import { Field } from "../../../components/Field/Field";
import { Segmented } from "../../../components/Segmented/Segmented";
import { useDraft } from "../../../hooks/useDraft";
import { onSaveKey } from "../../../keys";
import { call, run } from "../../../rpc";
import type { Meta } from "../../../shared";
import {
	MEMORY_NAME,
	MEMORY_TYPES,
	type MemoryNote,
	type MemoryProject,
	TYPE_COLORS,
	noteName,
	noteType,
	record,
} from "../types";
import styles from "./NoteForm.module.scss";

interface Draft {
	name: string;
	description: string;
	type: string;
	body: string;
}

export function NoteForm({
	project,
	note,
	onSaved,
	onClose,
}: {
	project: MemoryProject;
	note?: MemoryNote;
	onSaved: (file: string) => void;
	onClose?: () => void;
}) {
	const { draft: form, setDraft: setForm, dirty, markSaved } = useDraft(noteDraft(note));
	const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setForm((f) => ({ ...f, [key]: value }));
	const nameError = !!form.name && !MEMORY_NAME.test(form.name);
	const valid = !!form.name && !nameError && !!form.description.trim() && (!note || dirty);
	const types = !form.type || MEMORY_TYPES.includes(form.type) ? MEMORY_TYPES : [...MEMORY_TYPES, form.type];

	const save = async () => {
		if (!valid) return;
		const file = await run(
			call("saveMemoryNote", project.slug, note?.file ?? null, noteMeta(note, form), form.body),
			"Note saved",
		);
		if (!file) return;
		markSaved(form);
		onSaved(file);
	};
	const remove = async () => {
		if (note) await run(call("deleteMemoryNote", project.slug, note.file));
	};

	return (
		<div className={styles.noteForm} onKeyDown={onSaveKey(save)}>
			<Field label="Name" error help={nameError && "Only letters, digits, hyphens and underscores"}>
				<input
					value={form.name}
					autoFocus={!note}
					placeholder="scss-nesting"
					aria-invalid={nameError}
					onChange={(e) => set("name", e.target.value)}
				/>
			</Field>
			<Field label="Description">
				<input
					value={form.description}
					placeholder="One line Claude uses to decide if the note is relevant"
					onChange={(e) => set("description", e.target.value)}
				/>
			</Field>
			<Field label="Type" group>
				<Segmented
					value={form.type}
					onChange={(v) => set("type", v)}
					options={types.map((t) => ({ value: t, label: t, color: TYPE_COLORS[t] ?? "var(--t)" }))}
				/>
			</Field>
			<Field label="Text">
				<Editor
					compact
					value={form.body}
					placeholder={"The fact itself.\n\n**Why:** …\n**How to apply:** …"}
					onChange={(e) => set("body", e.target.value)}
				/>
			</Field>
			<div className="toolbar">
				{note && (
					<Button
						variant="ghost"
						icon="go-to-file"
						onClick={() => run(call("openMemory", project.slug, note.file))}
					>
						File
					</Button>
				)}
				<span className="grow" />
				{note && (
					<Button variant="ghost" danger icon="trash" onClick={remove}>
						Delete
					</Button>
				)}
				{onClose && (
					<Button variant="ghost" onClick={onClose}>
						Cancel
					</Button>
				)}
				<Button variant="primary" icon="save" disabled={!valid} onClick={save}>
					Save
				</Button>
			</div>
		</div>
	);
}

function noteDraft(note?: MemoryNote): Draft {
	return {
		name: note ? noteName(note) : "",
		description: String(note?.meta.description ?? ""),
		type: note ? noteType(note.meta) : "project",
		body: note?.body ?? "",
	};
}

function noteMeta(note: MemoryNote | undefined, f: Draft): Meta {
	const meta: Meta = { ...note?.meta, name: f.name, description: f.description };
	if (meta.type !== undefined && meta.metadata === undefined) meta.type = f.type;
	else meta.metadata = { ...record(meta.metadata), type: f.type };
	return meta;
}
