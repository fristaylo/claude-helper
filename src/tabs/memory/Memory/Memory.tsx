import { useState } from "react";
import { Count } from "../../../components/Count/Count";
import { Empty } from "../../../components/Empty/Empty";
import { Search } from "../../../components/Search/Search";
import { Icon } from "../../../icons";
import type { Scope } from "../../../shared";
import { ProjectBlock } from "../ProjectBlock/ProjectBlock";
import { type MemoryProject, matches } from "../types";
import styles from "./Memory.module.scss";

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

	if (scope === "project" && memory.current) {
		return (
			<div className="page">
				<ProjectBlock
					project={memory.current}
					needle={needle}
					search={<Search value={q} onChange={setQ} placeholder="Search notes" />}
				/>
			</div>
		);
	}

	const groups = memory.others.filter((p) => !needle || p.notes.some((n) => matches(n, needle)));
	return (
		<div className="page">
			<p className="muted small">Memory of other projects</p>
			{memory.others.length > 0 && <Search wide value={q} onChange={setQ} placeholder="Search all notes" />}
			{memory.others.length === 0 && (
				<Empty icon="lightbulb" title="No memory yet">
					<p>Claude Code saves notes per project. They will show up here.</p>
				</Empty>
			)}
			{groups.map((p) => {
				const isOpen = !!needle || expanded.includes(p.slug);
				return (
					<div className={styles.proj} key={p.slug}>
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
							<Count>{p.notes.length}</Count>
						</button>
						{isOpen && (
							<div className={styles.projBody}>
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
