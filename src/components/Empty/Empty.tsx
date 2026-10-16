import type { ReactNode } from "react";
import { Icon } from "../../icons";
import styles from "./Empty.module.scss";

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
		<div className={styles.empty}>
			<div className={styles.icon}>
				<Icon name={icon} />
			</div>
			<h3>{title}</h3>
			{children}
		</div>
	);
}
