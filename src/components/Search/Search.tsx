import { Icon } from "../../icons";
import styles from "./Search.module.scss";

export function Search({
	value,
	onChange,
	placeholder,
	icon = "search",
	wide,
	block,
}: {
	value: string;
	onChange: (v: string) => void;
	placeholder: string;
	icon?: string;
	wide?: boolean;
	block?: boolean;
}) {
	return (
		<label className={`${styles.search} ${wide ? styles.wide : ""} ${block ? styles.block : ""}`}>
			<Icon name={icon} />
			<input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
		</label>
	);
}
