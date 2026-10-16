import type { ReactNode } from "react";
import styles from "./Field.module.scss";

export function Field({
	label,
	hint,
	help,
	error,
	group,
	grow,
	children,
}: {
	label: ReactNode;
	hint?: ReactNode;
	help?: ReactNode;
	error?: boolean;
	group?: boolean;
	grow?: boolean;
	children: ReactNode;
}) {
	const Tag = group ? "div" : "label";
	return (
		<Tag className={`${styles.field} ${grow ? styles.grow : ""}`}>
			<span className={styles.label}>
				{label}
				{hint && <span className={styles.hint}>{hint}</span>}
			</span>
			{children}
			{help && <span className={`${styles.help} ${error ? styles.error : ""}`}>{help}</span>}
		</Tag>
	);
}
