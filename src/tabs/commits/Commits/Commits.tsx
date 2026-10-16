import { useState } from "react";
import { Banner } from "../../../components/Banner/Banner";
import { Button } from "../../../components/Button/Button";
import { Checkbox } from "../../../components/Checkbox/Checkbox";
import { Field } from "../../../components/Field/Field";
import { useDraft } from "../../../hooks/useDraft";
import { Icon } from "../../../icons";
import { onSaveKey } from "../../../keys";
import { call, run } from "../../../rpc";
import { EFFORTS } from "../../../shared";
import { COMMIT_MODELS, type CommitModel, type CommitSettings } from "../types";

export function Commits({ settings }: { settings: CommitSettings }) {
	const { draft: prompt, setDraft: setPrompt, dirty, markSaved } = useDraft(settings.prompt);
	const [path, setPath] = useState(settings.claudePath);
	const [syncedPath, setSyncedPath] = useState(settings.claudePath);
	if (settings.claudePath !== syncedPath) {
		setPath(settings.claudePath);
		setSyncedPath(settings.claudePath);
	}
	const save = (patch: Partial<CommitSettings>) => run(call("setCommit", patch), "Saved");

	const savePrompt = async () => {
		if (dirty && (await save({ prompt }))) markSaved(prompt);
	};
	const savePath = () => {
		const value = path.trim();
		if (value !== settings.claudePath) save({ claudePath: value });
	};

	return (
		<div className="page">
			<Banner kind="info" icon="sparkle">
				Click ✨ in the Source Control title bar to write the commit message with Claude. Staged changes are
				used; if nothing is staged — all changes.
			</Banner>
			<div className="fields">
				<Field label="Instructions" group>
					<textarea
						rows={10}
						value={prompt}
						spellCheck={false}
						onChange={(e) => setPrompt(e.target.value)}
						onKeyDown={onSaveKey(savePrompt)}
					/>
					<div className="toolbar">
						<span className="grow" />
						<Button variant="primary" disabled={!dirty} onClick={savePrompt}>
							<Icon name={dirty ? "circle-filled" : "check"} className="small" /> {dirty ? "Save" : "Saved"}
						</Button>
					</div>
				</Field>
				<Field label="Model">
					<select value={settings.model} onChange={(e) => save({ model: e.target.value as CommitModel })}>
						{COMMIT_MODELS.map((m) => (
							<option key={m} value={m}>
								{m}
							</option>
						))}
					</select>
				</Field>
				<Field label="Effort">
					<select value={settings.effort} onChange={(e) => save({ effort: e.target.value })}>
						<option value="">default</option>
						{EFFORTS.map((m) => (
							<option key={m} value={m}>
								{m}
							</option>
						))}
					</select>
				</Field>
				<Field label="Claude path">
					<input
						value={path}
						placeholder="auto-detect"
						onChange={(e) => setPath(e.target.value)}
						onBlur={savePath}
						onKeyDown={(e) => e.key === "Enter" && savePath()}
					/>
				</Field>
				<label className="toolbar">
					<Checkbox checked={settings.untracked} onChange={(e) => save({ untracked: e.target.checked })} />
					Include untracked files
				</label>
			</div>
		</div>
	);
}
