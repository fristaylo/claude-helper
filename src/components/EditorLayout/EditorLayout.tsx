import { type CSSProperties, type ReactNode, useState } from "react";
import { onSaveKey } from "../../keys";
import { Avatar } from "../Avatar/Avatar";
import { Banner } from "../Banner/Banner";
import { Button } from "../Button/Button";
import styles from "./EditorLayout.module.scss";

export function EditorLayout({
	color,
	icon,
	title,
	dirty,
	canSave,
	onSave,
	onBack,
	backTitle,
	onOpenFile,
	onDelete,
	fields,
	children,
}: {
	color: string;
	icon: string;
	title: string;
	dirty: boolean;
	canSave: boolean;
	onSave: () => void;
	onBack: () => void;
	backTitle: string;
	onOpenFile?: () => void;
	onDelete?: () => void;
	fields: ReactNode;
	children: ReactNode;
}) {
	const [leaving, setLeaving] = useState(false);

	return (
		<div className="page" style={{ "--agent": color } as CSSProperties} onKeyDown={onSaveKey(onSave)}>
			<div className="toolbar">
				<Button
					variant="ghost"
					iconOnly
					icon="arrow-left"
					title={backTitle}
					onClick={() => (dirty ? setLeaving(true) : onBack())}
				/>
				<Avatar small icon={icon} />
				<h2 className="title">{title}</h2>
				{dirty && <span className={styles.dot} title="Unsaved changes" />}
				<span className="grow" />
				{onOpenFile && (
					<Button variant="ghost" icon="go-to-file" onClick={onOpenFile}>
						File
					</Button>
				)}
				{onDelete && (
					<Button variant="ghost" danger icon="trash" onClick={onDelete}>
						Delete
					</Button>
				)}
				<Button variant="primary" icon="save" disabled={!dirty || !canSave} onClick={onSave}>
					Save
				</Button>
			</div>

			{leaving && (
				<Banner kind="warn" icon="warning">
					You have unsaved changes.
					<span className="grow" />
					<Button variant="ghost" onClick={() => setLeaving(false)}>
						Keep editing
					</Button>
					<Button variant="ghost" danger onClick={onBack}>
						Discard
					</Button>
				</Banner>
			)}

			<div className={styles.grid}>
				<div className="fields">{fields}</div>
				{children}
			</div>
		</div>
	);
}
