import { marked } from "marked";
import { useState } from "react";
import { call, onSaveKey, run } from "./rpc";
import { Icon, Segmented } from "./ui";

export function Memory({ text }: { text: string | null }) {
	const disk = text ?? "";
	const [draft, setDraft] = useState(disk);
	const [synced, setSynced] = useState(disk);
	const [mode, setMode] = useState<"edit" | "preview">("edit");
	if (disk !== synced) {
		if (draft === synced) setDraft(disk);
		setSynced(disk);
	}
	const dirty = draft !== synced;

	const save = async () => {
		if (!dirty) return;
		const value = draft;
		if (await run(call("saveMemory", value), "CLAUDE.md saved")) setSynced(value);
	};

	return (
		<div className="page memory">
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
					<button type="button" className="ghost" onClick={() => run(call("open", "CLAUDE.md"))}>
						<Icon name="go-to-file" /> Open file
					</button>
				)}
				<button type="button" className="primary" disabled={!dirty} onClick={save}>
					<Icon name={dirty ? "circle-filled" : "check"} className="small" /> {dirty ? "Save" : "Saved"}
				</button>
			</div>
			{text === null && (
				<div className="banner info">
					<Icon name="info" /> CLAUDE.md does not exist yet. It will be created when you save.
				</div>
			)}
			{mode === "edit" ? (
				<textarea
					className="editor"
					value={draft}
					spellCheck={false}
					placeholder={"# Global instructions\n\nRules Claude Code follows in every project…"}
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={onSaveKey(save)}
				/>
			) : (
				<div
					className="markdown"
					dangerouslySetInnerHTML={{ __html: marked.parse(draft || "*Empty*", { async: false }) }}
				/>
			)}
		</div>
	);
}
