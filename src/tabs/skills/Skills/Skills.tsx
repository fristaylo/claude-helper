import { type CSSProperties, useState } from "react";
import { Avatar } from "../../../components/Avatar/Avatar";
import { Button } from "../../../components/Button/Button";
import { Chip } from "../../../components/Chip/Chip";
import { metaColor } from "../../../components/ColorPicker/ColorPicker";
import { Empty } from "../../../components/Empty/Empty";
import { metaIcon } from "../../../components/IconPicker/IconPicker";
import { Row, Rows, RowsEmpty } from "../../../components/Rows/Rows";
import { Search } from "../../../components/Search/Search";
import type { Scope } from "../../../shared";
import { SkillEditor } from "../SkillEditor/SkillEditor";
import { type Skill, skillName } from "../types";

export function Skills({ scope, skills }: { scope: Scope; skills: Skill[] }) {
	const [open, setOpen] = useState<{ skill?: Skill }>();
	const [q, setQ] = useState("");

	if (open) return <SkillEditor scope={scope} skill={open.skill} onClose={() => setOpen(undefined)} />;

	const needle = q.toLowerCase();
	const shown = skills.filter((s) =>
		`${skillName(s)} ${s.meta.description ?? ""}`.toLowerCase().includes(needle),
	);

	return (
		<div className="page">
			<div className="toolbar">
				<Search value={q} onChange={setQ} placeholder="Search skills" />
				<span className="grow" />
				<Button variant="primary" icon="add" onClick={() => setOpen({})}>
					New skill
				</Button>
			</div>
			{skills.length === 0 ? (
				<Empty icon="mortar-board" title="No skills yet">
					<p>
						Skills are folders with a SKILL.md that Claude loads when its description matches the task.
						{scope === "project"
							? " Skills of this project live in its .claude/skills folder."
							: " Global skills live in ~/.claude/skills and are available in every project."}
					</p>
					<Button variant="primary" icon="sparkle" onClick={() => setOpen({})}>
						Create your first skill
					</Button>
				</Empty>
			) : (
				<Rows>
					{shown.map((s) => (
						<Row
							key={s.name}
							style={{ "--agent": metaColor(s.meta) } as CSSProperties}
							icon={<Avatar small icon={metaIcon(s.meta, "mortar-board")} />}
							title={skillName(s)}
							subtitle={String(s.meta.description ?? "")}
							trailing={<Chip title="Files in the skill folder">{s.files.length + 1}</Chip>}
							onClick={() => setOpen({ skill: s })}
						/>
					))}
					{!shown.length && <RowsEmpty>Nothing matches “{q}”.</RowsEmpty>}
				</Rows>
			)}
		</div>
	);
}
