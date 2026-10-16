import { Icon } from "../../icons";
import styles from "./Nav.module.scss";

export function Nav<T extends string>({
	tabs,
	tab,
	onTab,
}: {
	tabs: { id: T; icon: string; label: string }[];
	tab: T;
	onTab: (t: T) => void;
}) {
	return (
		<nav className={styles.nav}>
			{tabs.map((t) => (
				<button
					type="button"
					key={t.id}
					className={t.id === tab ? styles.on : ""}
					title={t.label}
					aria-label={t.label}
					onClick={() => onTab(t.id)}
				>
					<Icon name={t.icon} />
					<span className={styles.label}>{t.label}</span>
				</button>
			))}
		</nav>
	);
}
