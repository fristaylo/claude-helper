import { useState } from "react";
import { COMMIT_MODELS, type CommitModel, type CommitSettings, EFFORTS } from "../shared";
import { call, onSaveKey, run } from "./rpc";
import { Icon } from "./ui";

export function Commits({ settings }: { settings: CommitSettings }) {
	const [prompt, setPrompt] = useState(settings.prompt);
	const [syncedPrompt, setSyncedPrompt] = useState(settings.prompt);
	const [path, setPath] = useState(settings.claudePath);
	const [syncedPath, setSyncedPath] = useState(settings.claudePath);
	if (settings.prompt !== syncedPrompt) {
		if (prompt === syncedPrompt) setPrompt(settings.prompt);
		setSyncedPrompt(settings.prompt);
	}
	if (settings.claudePath !== syncedPath) {
		setPath(settings.claudePath);
		setSyncedPath(settings.claudePath);
	}
	const dirty = prompt !== syncedPrompt;
	const save = (patch: Partial<CommitSettings>) => run(call("setCommit", patch), "Saved");

	const savePrompt = async () => {
		if (!dirty) return;
		const value = prompt;
		if (await save({ prompt: value })) setSyncedPrompt(value);
	};
	const savePath = () => {
		const value = path.trim();
		if (value !== settings.claudePath) save({ claudePath: value });
	};

	return (
		<div className="page">
			<div className="banner info">
				<Icon name="sparkle" /> Click ✨ in the Source Control title bar to write the commit message with
				Claude. Staged changes are used; if nothing is staged — all changes.
			</div>
			<div className="fields">
				<div className="field">
					<span className="label">Instructions</span>
					<textarea
						rows={10}
						value={prompt}
						spellCheck={false}
						onChange={(e) => setPrompt(e.target.value)}
						onKeyDown={onSaveKey(savePrompt)}
					/>
					<div className="toolbar">
						<span className="grow" />
						<button type="button" className="primary" disabled={!dirty} onClick={savePrompt}>
							<Icon name={dirty ? "circle-filled" : "check"} className="small" /> {dirty ? "Save" : "Saved"}
						</button>
					</div>
				</div>
				<label className="field">
					<span className="label">Model</span>
					<select value={settings.model} onChange={(e) => save({ model: e.target.value as CommitModel })}>
						{COMMIT_MODELS.map((m) => (
							<option key={m} value={m}>
								{m}
							</option>
						))}
					</select>
				</label>
				<label className="field">
					<span className="label">Effort</span>
					<select value={settings.effort} onChange={(e) => save({ effort: e.target.value })}>
						<option value="">default</option>
						{EFFORTS.map((m) => (
							<option key={m} value={m}>
								{m}
							</option>
						))}
					</select>
				</label>
				<label className="field">
					<span className="label">Claude path</span>
					<input
						value={path}
						placeholder="auto-detect"
						onChange={(e) => setPath(e.target.value)}
						onBlur={savePath}
						onKeyDown={(e) => e.key === "Enter" && savePath()}
					/>
				</label>
				<label className="toolbar">
					<input
						type="checkbox"
						className="check"
						checked={settings.untracked}
						onChange={(e) => save({ untracked: e.target.checked })}
					/>
					Include untracked files
				</label>
			</div>
		</div>
	);
}
