import type { CSSProperties, ReactNode } from "react";
import styles from "./Rows.module.scss";

export function Rows({ children }: { children: ReactNode }) {
	return <div className={styles.rows}>{children}</div>;
}

export function RowsEmpty({ children }: { children: ReactNode }) {
	return <p className={`muted ${styles.empty}`}>{children}</p>;
}

export function Row({
	icon,
	title,
	subtitle,
	trailing,
	onClick,
	style,
	hint,
}: {
	icon: ReactNode;
	title: ReactNode;
	subtitle?: ReactNode;
	trailing?: ReactNode;
	onClick?: () => void;
	style?: CSSProperties;
	hint?: string;
}) {
	const content = (
		<>
			{icon}
			<span className={styles.main}>
				<b>{title}</b>
				{subtitle !== undefined && <span>{subtitle}</span>}
			</span>
			{trailing}
		</>
	);
	if (!onClick) {
		return (
			<div className={styles.row} style={style} title={hint}>
				{content}
			</div>
		);
	}
	return (
		<button type="button" className={styles.row} style={style} title={hint} onClick={onClick}>
			{content}
		</button>
	);
}
