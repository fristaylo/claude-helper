import type { CSSProperties, ReactNode } from "react";
import styles from "./Chip.module.scss";

export function Chip({
	accent,
	color,
	title,
	children,
}: {
	accent?: boolean;
	color?: string;
	title?: string;
	children: ReactNode;
}) {
	return (
		<span
			className={`${styles.chip} ${accent ? styles.accent : ""} ${color ? styles.tinted : ""}`}
			style={color ? ({ "--t": color } as CSSProperties) : undefined}
			title={title}
		>
			{children}
		</span>
	);
}
