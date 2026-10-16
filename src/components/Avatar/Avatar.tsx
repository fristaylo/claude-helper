import { Icon } from "../../icons";
import styles from "./Avatar.module.scss";

export function Avatar({ icon, small }: { icon: string; small?: boolean }) {
	return (
		<span className={`${styles.avatar} ${small ? styles.small : ""}`}>
			<Icon name={icon} />
		</span>
	);
}
