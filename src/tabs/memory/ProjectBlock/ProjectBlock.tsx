import { type CSSProperties, type ReactNode, useState } from "react";
import { Button } from "../../../components/Button/Button";
import { Chip } from "../../../components/Chip/Chip";
import { Icon } from "../../../icons";
import { IndexBanner } from "../IndexBanner/IndexBanner";
import { NoteForm } from "../NoteForm/NoteForm";
import { type MemoryProject, TYPE_COLORS, matches, noteName, noteType } from "../types";
import styles from "./ProjectBlock.module.scss";

export function ProjectBlock({
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
		<div className={styles.memBlock}>
			<div className="toolbar">
				{search}
				<span className="grow" />
				<Button
					variant="primary"
					icon="add"
					onClick={() => {
						setOpenFile(null);
						setCreating(true);
					}}
				>
					New note
				</Button>
			</div>

			<IndexBanner project={project} />

			{creating && (
				<div className={styles.acc} style={{ "--t": TYPE_COLORS.project } as CSSProperties}>
					<div className={styles.inner}>
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

			<div className={styles.memList}>
				{shown.map((n) => {
					const type = noteType(n.meta);
					const color = TYPE_COLORS[type];
					const isOpen = openFile === n.file;
					return (
						<div
							className={styles.acc}
							style={color ? ({ "--t": color } as CSSProperties) : undefined}
							key={n.file}
						>
							<button type="button" onClick={() => setOpenFile(isOpen ? null : n.file)}>
								<Icon name={isOpen ? "chevron-down" : "chevron-right"} />
								<span className={styles.main}>
									<b>{noteName(n)}</b>
									<span>{String(n.meta.description ?? "")}</span>
								</span>
								{type && <Chip color={color ?? "var(--muted)"}>{type}</Chip>}
							</button>
							{isOpen && (
								<div className={styles.inner}>
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
