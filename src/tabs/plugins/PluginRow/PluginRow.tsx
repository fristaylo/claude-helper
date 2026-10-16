import type { ReactNode } from "react";
import { Avatar } from "../../../components/Avatar/Avatar";
import styles from "./PluginRow.module.scss";

export function PluginRow({
	title,
	chips,
	description,
	line,
	meta,
	off,
	actions,
}: {
	title: ReactNode;
	chips: ReactNode;
	description: string;
	line?: boolean;
	meta?: ReactNode;
	off?: boolean;
	actions: ReactNode;
}) {
	return (
		<div className={`${styles.plug} ${off ? styles.off : ""}`}>
			<Avatar icon="extensions" />
			<div className={styles.main}>
				<b>
					{title}
					{chips}
				</b>
				<p className={line ? styles.line : ""}>{description}</p>
				{meta}
			</div>
			<div className={styles.side}>{actions}</div>
		</div>
	);
}
