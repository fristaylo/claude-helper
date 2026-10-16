import { type ReactNode, useState } from "react";
import {
	MEMORY_NAME,
	MEMORY_TYPES,
	type MemoryNote,
	type MemoryProject,
	type Meta,
	type Scope,
} from "../shared";
import { call, onSaveKey, run } from "./rpc";
import { Empty, Icon, Segmented } from "./ui";

interface Draft {
	name: string;
	description: string;
	type: string;
	body: string;
}

export function Memory({
	scope,
	memory,
}: {
	scope: Scope;
	memory: { current: MemoryProject | null; others: MemoryProject[] };
}) {
	const [q, setQ] = useState("");
	const [expanded, setExpanded] = useState<string[]>([]);
	const needle = q.toLowerCase();
	const search = (placeholder: string) => (
		<label className="search">
			<Icon name="search" />
			<input value={q} placeholder={placeholder} onChange={(e) => setQ(e.target.value)} />
		</label>
	);

	if (scope === "project" && memory.current) {
		return (
			<div className="page mem-page">
				<ProjectBlock project={memory.current} needle={needle} search={search("Search notes")} />
			</div>
		);
	}

	const groups = memory.others.filter((p) => !needle || p.notes.some((n) => matches(n, needle)));
	return (
		<div className="page mem-page">
			<p className="muted small">Memory of other projects</p>
			{memory.others.length > 0 && search("Search all notes")}
			{memory.others.length === 0 && (
				<Empty icon="lightbulb" title="No memory yet">
					<p>Claude Code saves notes per project. They will show up here.</p>
				</Empty>
			)}
			{groups.map((p) => {
				const isOpen = !!needle || expanded.includes(p.slug);
				return (
					<div className="proj" key={p.slug}>
						<button
							type="button"
							onClick={() =>
								setExpanded((e) => (e.includes(p.slug) ? e.filter((s) => s !== p.slug) : [...e, p.slug]))
							}
						>
							<Icon name={isOpen ? "chevron-down" : "chevron-right"} />
							<Icon name="folder" />
							<b>{p.label}</b>
							<span className="grow" />
							<span className="count">{p.notes.length}</span>
						</button>
						{isOpen && (
							<div className="proj-body">
								<ProjectBlock project={p} needle={needle} />
							</div>
						)}
					</div>
				);
			})}
			{memory.others.length > 0 && !groups.length && <p className="muted">Nothing matches “{q}”.</p>}
		</div>
	);
}

function ProjectBlock({
	project,
	needle,
	search,
}: {
	project: MemoryProject;
	needle: string;
	search?: ReactNode;
}) {
	const [openFile, setOpenFile] = useState<string | null>(null);
	const [creating, setCreating] = useState(false);
	const shown = project.notes.filter((n) => matches(n, needle));

	return (
		<div className="mem-block">
			<div className="toolbar">
				{search}
				<span className="grow" />
				<button
					type="button"
					className="primary"
					onClick={() => {
						setOpenFile(null);
						setCreating(true);
					}}
				>
					<Icon name="add" /> New note
				</button>
			</div>

			<IndexBanner project={project} />

			{creating && (
				<div className="acc t-project">
					<div className="inner">
						<NoteForm
							project={project}
							onClose={() => setCreating(false)}
							onSaved={(file) => {
								setCreating(false);
								setOpenFile(file);
							}}
						/>
					</div>
				</div>
			)}

			<div className="mem-list">
				{shown.map((n) => {
					const type = noteType(n.meta);
					const isOpen = openFile === n.file;
					return (
						<div className={`acc ${MEMORY_TYPES.includes(type) ? `t-${type}` : ""}`} key={n.file}>
							<button type="button" onClick={() => setOpenFile(isOpen ? null : n.file)}>
								<Icon name={isOpen ? "chevron-down" : "chevron-right"} />
								<span className="main">
									<b>{noteName(n)}</b>
									<span>{String(n.meta.description ?? "")}</span>
								</span>
								{type && <span className="chip tchip">{type}</span>}
							</button>
							{isOpen && (
								<div className="inner">
									<NoteForm project={project} note={n} onSaved={setOpenFile} />
								</div>
							)}
						</div>
					);
				})}
				{!shown.length && project.notes.length > 0 && <p className="muted">Nothing matches.</p>}
			</div>
		</div>
	);
}

function IndexBanner({ project }: { project: MemoryProject }) {
	const disk = project.index ?? "";
	const [draft, setDraft] = useState(disk);
	const [synced, setSynced] = useState(disk);
	const [editing, setEditing] = useState(false);
	if (disk !== synced) {
		if (draft === synced) setDraft(disk);
		setSynced(disk);
	}
	const dirty = draft !== synced;

	const save = async () => {
		if (!dirty) return;
		const value = draft;
		if (await run(call("saveMemoryIndex", project.slug, value), "Index saved")) setSynced(value);
	};

	return (
		<div className="index" onKeyDown={onSaveKey(save)}>
			<div className="banner info">
				<Icon name="book" />
				<span>
					<b>MEMORY.md</b> — index loaded into every session
					{project.index === null && ". It will be created with the first note."}
				</span>
				<span className="grow" />
				<button type="button" className="ghost" onClick={() => setEditing(!editing)}>
					<Icon name="edit" /> Edit
				</button>
				{project.index !== null && (
					<button
						type="button"
						className="ghost icon-only"
						title="Open MEMORY.md"
						onClick={() => run(call("openMemory", project.slug, "MEMORY.md"))}
					>
						<Icon name="go-to-file" />
					</button>
				)}
			</div>
			{editing && (
				<div className="index-edit">
					<textarea
						className="editor"
						value={draft}
						spellCheck={false}
						placeholder="- [Title](file.md) — one-line description"
						onChange={(e) => setDraft(e.target.value)}
					/>
					<div className="toolbar">
						<span className="grow" />
						<button type="button" className="primary" disabled={!dirty} onClick={save}>
							<Icon name="save" /> Save
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

function NoteForm({
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
	const disk = JSON.stringify(noteDraft(note));
	const [form, setForm] = useState(() => noteDraft(note));
	const [synced, setSynced] = useState(disk);
	if (disk !== synced) {
		if (JSON.stringify(form) === synced) setForm(noteDraft(note));
		setSynced(disk);
	}
	const dirty = JSON.stringify(form) !== synced;
	const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setForm((f) => ({ ...f, [key]: value }));
	const nameError = form.name && !MEMORY_NAME.test(form.name);
	const valid = !!form.name && !nameError && !!form.description.trim() && (!note || dirty);
	const types = !form.type || MEMORY_TYPES.includes(form.type) ? MEMORY_TYPES : [...MEMORY_TYPES, form.type];

	const save = async () => {
		if (!valid) return;
		const file = await run(
			call("saveMemoryNote", project.slug, note?.file ?? null, noteMeta(note, form), form.body),
			"Note saved",
		);
		if (!file) return;
		setSynced(JSON.stringify(form));
		onSaved(file);
	};
	const remove = async () => {
		if (note) await run(call("deleteMemoryNote", project.slug, note.file));
	};

	return (
		<div className="note-form" onKeyDown={onSaveKey(save)}>
			<label className="field">
				<span className="label">Name</span>
				<input
					value={form.name}
					autoFocus={!note}
					placeholder="scss-nesting"
					className={nameError ? "invalid" : ""}
					onChange={(e) => set("name", e.target.value)}
				/>
				{nameError && <span className="help error">Only letters, digits, hyphens and underscores</span>}
			</label>
			<label className="field">
				<span className="label">Description</span>
				<input
					value={form.description}
					placeholder="One line Claude uses to decide if the note is relevant"
					onChange={(e) => set("description", e.target.value)}
				/>
			</label>
			<div className="field">
				<span className="label">Type</span>
				<Segmented
					value={form.type}
					onChange={(v) => set("type", v)}
					options={types.map((t) => ({ value: t, label: t, className: `t-${t}` }))}
				/>
			</div>
			<label className="field">
				<span className="label">Text</span>
				<textarea
					className="editor"
					value={form.body}
					spellCheck={false}
					placeholder={"The fact itself.\n\n**Why:** …\n**How to apply:** …"}
					onChange={(e) => set("body", e.target.value)}
				/>
			</label>
			<div className="toolbar">
				{note && (
					<button
						type="button"
						className="ghost"
						onClick={() => run(call("openMemory", project.slug, note.file))}
					>
						<Icon name="go-to-file" /> File
					</button>
				)}
				<span className="grow" />
				{note && (
					<button type="button" className="ghost danger" onClick={remove}>
						<Icon name="trash" /> Delete
					</button>
				)}
				{onClose && (
					<button type="button" className="ghost" onClick={onClose}>
						Cancel
					</button>
				)}
				<button type="button" className="primary" disabled={!valid} onClick={save}>
					<Icon name="save" /> Save
				</button>
			</div>
		</div>
	);
}

const record = (v: unknown): Record<string, unknown> =>
	typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

const noteType = (meta: Meta) => String(record(meta.metadata).type ?? meta.type ?? "");

const noteName = (n: MemoryNote) => String(n.meta.name || n.file.replace(/\.md$/, ""));

const matches = (n: MemoryNote, needle: string) =>
	`${noteName(n)} ${n.meta.description ?? ""} ${n.file}`.toLowerCase().includes(needle);

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
