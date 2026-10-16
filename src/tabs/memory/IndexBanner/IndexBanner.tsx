import { useState } from "react";
import { Banner } from "../../../components/Banner/Banner";
import { Button } from "../../../components/Button/Button";
import { Editor } from "../../../components/Editor/Editor";
import { useDraft } from "../../../hooks/useDraft";
import { onSaveKey } from "../../../keys";
import { call, run } from "../../../rpc";
import type { MemoryProject } from "../types";
import styles from "./IndexBanner.module.scss";

export function IndexBanner({ project }: { project: MemoryProject }) {
	const { draft, setDraft, dirty, markSaved } = useDraft(project.index ?? "");
	const [editing, setEditing] = useState(false);

	const save = async () => {
		if (!dirty) return;
		const value = draft;
		if (await run(call("saveMemoryIndex", project.slug, value), "Index saved")) markSaved(value);
	};

	return (
		<div onKeyDown={onSaveKey(save)}>
			<Banner kind="info" icon="book">
				<span>
					<b>MEMORY.md</b> — index loaded into every session
					{project.index === null && ". It will be created with the first note."}
				</span>
				<span className="grow" />
				<Button variant="ghost" icon="edit" onClick={() => setEditing(!editing)}>
					Edit
				</Button>
				{project.index !== null && (
					<Button
						variant="ghost"
						iconOnly
						icon="go-to-file"
						title="Open MEMORY.md"
						onClick={() => run(call("openMemory", project.slug, "MEMORY.md"))}
					/>
				)}
			</Banner>
			{editing && (
				<div className={styles.indexEdit}>
					<Editor
						compact
						value={draft}
						placeholder="- [Title](file.md) — one-line description"
						onChange={(e) => setDraft(e.target.value)}
					/>
					<div className="toolbar">
						<span className="grow" />
						<Button variant="primary" icon="save" disabled={!dirty} onClick={save}>
							Save
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
