import styles from "./Filters.module.scss";

export function Filters({
	options,
	value,
	onChange,
}: {
	options: { value: string; label: string }[];
	value?: string;
	onChange: (v: string) => void;
}) {
	return (
		<div className={styles.filters}>
			{options.map((o) => (
				<button
					type="button"
					key={o.value}
					className={o.value === value ? styles.on : ""}
					onClick={() => onChange(o.value)}
				>
					{o.label}
				</button>
			))}
		</div>
	);
}
