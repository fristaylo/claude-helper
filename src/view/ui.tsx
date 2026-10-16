import { type ReactNode, useRef, useState } from "react";
import type { Meta } from "../shared";

const words = (s: string) => s.split(" ");

export const COLORS: Record<string, string> = {
	red: "#e5534b",
	orange: "#e0823d",
	yellow: "#d4a72c",
	green: "#57ab5a",
	cyan: "#39c5cf",
	blue: "#539bf5",
	purple: "#b083f0",
	pink: "#e275ad",
};

export const ICON_GROUPS: Record<string, string[]> = {
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

export const ICONS = Object.values(ICON_GROUPS).flat();

export const metaColor = (meta: Meta) => COLORS[String(meta.color)] ?? "var(--accent)";
export const metaIcon = (meta: Meta, fallback: string) =>
	ICONS.includes(String(meta.icon)) ? String(meta.icon) : fallback;

export const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
	<i className={`codicon codicon-${name} ${className}`} />
);

export function Segmented<T extends string>({
	value,
	options,
	onChange,
}: {
	value: T;
	options: { value: T; label: ReactNode; icon?: string; className?: string }[];
	onChange: (v: T) => void;
}) {
	return (
		<div className="segmented" role="tablist">
			{options.map((o) => (
				<button
					key={o.value}
					type="button"
					role="tab"
					aria-selected={o.value === value}
					className={`${o.value === value ? "on" : ""} ${o.className ?? ""}`}
					onClick={() => onChange(o.value)}
				>
					{o.icon && <Icon name={o.icon} />}
					{o.label}
				</button>
			))}
		</div>
	);
}

export function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
	return (
		<div className="swatches">
			<button
				type="button"
				title="No color"
				className={`swatch none ${value ? "" : "on"}`}
				onClick={() => onChange("")}
			>
				<Icon name="circle-slash" />
			</button>
			{Object.entries(COLORS).map(([c, hex]) => (
				<button
					type="button"
					key={c}
					title={c}
					className={`swatch ${value === c ? "on" : ""}`}
					style={{ background: hex }}
					onClick={() => onChange(c)}
				/>
			))}
		</div>
	);
}

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
		<div className="icon-picker">
			<label className="search">
				<Icon name="search" />
				<input value={q} placeholder="Search icons" onChange={(e) => setQ(e.target.value)} />
			</label>
			<div className="filters">
				{Object.keys(ICON_GROUPS).map((name) => (
					<button type="button" key={name} onClick={() => jump(name)}>
						{name}
					</button>
				))}
			</div>
			<div className="ip-box" ref={box}>
				{groups.map((g) => (
					<div key={g.name} data-cat={g.name}>
						<div className="ip-cat">{g.name}</div>
						<div className="ip-grid">
							{g.icons.map((i) => (
								<button
									type="button"
									key={i}
									title={i}
									className={i === value ? "on" : ""}
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
			<div className="ip-foot">
				<span>{ICONS.length} icons</span>
				<code>{value}</code>
			</div>
		</div>
	);
}

export function Empty({
	icon,
	title,
	children,
}: {
	icon: string;
	title: string;
	children?: ReactNode;
}) {
	return (
		<div className="empty">
			<div className="empty-icon">
				<Icon name={icon} />
			</div>
			<h3>{title}</h3>
			{children}
		</div>
	);
}

export const Spark = ({ size = 22 }: { size?: number }) => (
	<svg className="spark" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
		<path
			fill="currentColor"
			d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.970 2.970 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.030.456.898.243.832.091.255h.158V9.010l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.020.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.810 2.509 2.330.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.620h-.128v.17l.444.649 2.345 3.521.122 1.080-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.530.286-1.900.17-.632-.012-.042-.14.018-1.434 1.967-2.180 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.440-1.882.93-1.086-.006-.158h-.055L4.132 18.560l-1.130.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z"
		/>
	</svg>
);
