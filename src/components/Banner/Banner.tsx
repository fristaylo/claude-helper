import type { ReactNode } from "react";
import { Icon } from "../../icons";
import styles from "./Banner.module.scss";

export function Banner({
	kind,
	icon,
	children,
}: {
	kind: "info" | "warn" | "error";
	icon: string;
	children: ReactNode;
}) {
	return (
		<div className={`${styles.banner} ${styles[kind]}`}>
			<Icon name={icon} />
			{children}
		</div>
	);
}
