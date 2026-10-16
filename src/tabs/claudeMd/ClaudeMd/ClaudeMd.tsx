import { marked } from "marked";
import { useState } from "react";
import { Banner } from "../../../components/Banner/Banner";
import { Button } from "../../../components/Button/Button";
import { Editor } from "../../../components/Editor/Editor";
import { Segmented } from "../../../components/Segmented/Segmented";
import { useDraft } from "../../../hooks/useDraft";
import { Icon } from "../../../icons";
import { onSaveKey } from "../../../keys";
import { call, run } from "../../../rpc";
import type { Scope } from "../../../shared";
import styles from "./ClaudeMd.module.scss";

export function ClaudeMd({ scope, text }: { scope: Scope; text: string | null }) {
	const { draft, setDraft, dirty, markSaved } = useDraft(text ?? "");
	const [mode, setMode] = useState<"edit" | "preview">("edit");

	const save = async () => {
		if (!dirty) return;
		const value = draft;
		if (await run(call("saveClaudeMd", scope, value), "CLAUDE.md saved")) markSaved(value);
	};

	return (
		<div className="page">
			<div className="toolbar">
				<Segmented
					value={mode}
					onChange={setMode}
					options={[
						{ value: "edit", icon: "edit", label: "Edit" },
						{ value: "preview", icon: "open-preview", label: "Preview" },
					]}
				/>
				<span className="muted small">
					{draft.split("\n").length} lines · {draft.length} chars
				</span>
				<span className="grow" />
				{text !== null && (
					<Button variant="ghost" icon="go-to-file" onClick={() => run(call("open", scope, "CLAUDE.md"))}>
						Open file
					</Button>
				)}
				<Button variant="primary" disabled={!dirty} onClick={save}>
					<Icon name={dirty ? "circle-filled" : "check"} className="small" /> {dirty ? "Save" : "Saved"}
				</Button>
			</div>
			{text === null && (
				<Banner kind="info" icon="info">
					CLAUDE.md does not exist yet. It will be created when you save.
				</Banner>
			)}
			{mode === "edit" ? (
				<Editor
					value={draft}
					placeholder={"# Global instructions\n\nRules Claude Code follows in every project…"}
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={onSaveKey(save)}
				/>
			) : (
				<div
					className={styles.markdown}
					dangerouslySetInnerHTML={{ __html: marked.parse(draft || "*Empty*", { async: false }) }}
				/>
			)}
		</div>
	);
}
