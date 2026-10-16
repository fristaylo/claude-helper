import { useRef, useState } from "react";
import { Icon } from "../../icons";
import type { Meta } from "../../shared";
import { Filters } from "../Filters/Filters";
import { Search } from "../Search/Search";
import styles from "./IconPicker.module.scss";

export const metaIcon = (meta: Meta, fallback: string) =>
	ICONS.includes(String(meta.icon)) ? String(meta.icon) : fallback;

export function IconPicker({ value, onChange }: { value: string; onChange: (icon: string) => void }) {
	const [q, setQ] = useState("");
	const box = useRef<HTMLDivElement>(null);
	const needle = q.trim().toLowerCase();
	const groups = Object.entries(ICON_GROUPS)
		.map(([name, icons]) => ({ name, icons: icons.filter((i) => i.includes(needle)) }))
		.filter((g) => g.icons.length);
	const jump = (name: string) => {
		const el = box.current?.querySelector<HTMLElement>(`[data-cat="${name}"]`);
		if (el) box.current?.scrollTo({ top: el.offsetTop, behavior: "smooth" });
	};

	return (
		<div className={styles.iconPicker}>
			<Search block value={q} onChange={setQ} placeholder="Search icons" />
			<Filters
				options={Object.keys(ICON_GROUPS).map((name) => ({ value: name, label: name }))}
				onChange={jump}
			/>
			<div className={styles.box} ref={box}>
				{groups.map((g) => (
					<div key={g.name} data-cat={g.name}>
						<div className={styles.cat}>{g.name}</div>
						<div className={styles.grid}>
							{g.icons.map((i) => (
								<button
									type="button"
									key={i}
									title={i}
									className={i === value ? styles.on : ""}
									onClick={() => onChange(i)}
								>
									<Icon name={i} />
								</button>
							))}
						</div>
					</div>
				))}
				{!groups.length && <span className="muted">No icons match</span>}
			</div>
			<div className={styles.foot}>
				<span>{ICONS.length} icons</span>
				<code>{value}</code>
			</div>
		</div>
	);
}

const ICON_GROUPS: Record<string, string[]> = {
	"AI & knowledge": words(
		"hubot robot sparkle sparkle-filled lightbulb lightbulb-sparkle lightbulb-autofix wand copilot mortar-board book library mic comment-discussion",
	),
	Code: words(
		"code terminal terminal-bash terminal-powershell symbol-method symbol-class symbol-variable symbol-namespace symbol-interface symbol-event symbol-key symbol-misc symbol-ruler json regex bracket-dot debug debug-alt bug beaker variable-group",
	),
	Files: words(
		"file file-code file-text file-media file-zip files folder folder-library new-file notebook markdown go-to-file archive save copy clippy",
	),
	Git: words(
		"git-branch git-commit git-merge git-pull-request git-compare source-control repo repo-forked github github-action history diff tag",
	),
	Infra: words(
		"tools wrench settings-gear gear extensions package plug database server server-process vm layers layers-active circuit-board chip pulse dashboard graph graph-line pie-chart output table list-tree type-hierarchy",
	),
	Web: words(
		"globe cloud cloud-upload cloud-download link rss broadcast radio-tower remote-explorer device-mobile device-desktop browser preview window layout",
	),
	Security: words(
		"shield lock unlock key verified verified-filled workspace-trusted workspace-untrusted eye eye-closed law",
	),
	Actions: words(
		"rocket zap flame play run-all debug-start sync refresh search filter checklist check-all tasklist pass edit pencil trash discard target milestone pin pinned",
	),
	People: words(
		"person account organization feedback smiley heart heart-filled star-full star-empty thumbsup coffee home briefcase gift",
	),
	Misc: words(
		"paintcan symbol-color telescope compass map location calendar watch clock bell megaphone mail inbox note flag bookmark question info warning music game squirrel ruby azure terminal-tmux vr",
	),
};

const ICONS = Object.values(ICON_GROUPS).flat();

function words(s: string) {
	return s.split(" ");
}
