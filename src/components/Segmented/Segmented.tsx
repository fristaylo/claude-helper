import type { CSSProperties, ReactNode } from "react";
import { Icon } from "../../icons";
import styles from "./Segmented.module.scss";

export function Segmented<T extends string>({
	value,
	options,
	onChange,
	color,
	className = "",
}: {
	value: T;
	options: {
		value: T;
		label: ReactNode;
		icon?: string;
		color?: string;
		disabled?: boolean;
		title?: string;
	}[];
	onChange: (v: T) => void;
	color?: string;
	className?: string;
}) {
	return (
		<div className={`${styles.segmented} ${className}`} role="tablist">
			{options.map((o) => (
				<button
					key={o.value}
					type="button"
					role="tab"
					aria-selected={o.value === value}
					className={o.value === value ? styles.on : ""}
					style={{ "--k": o.color ?? color ?? "var(--accent)" } as CSSProperties}
					disabled={o.disabled}
					title={o.title}
					onClick={() => onChange(o.value)}
				>
					{o.icon && <Icon name={o.icon} />}
					{o.label}
				</button>
			))}
		</div>
	);
}
