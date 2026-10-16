import { Icon } from "../../icons";
import type { Meta } from "../../shared";
import styles from "./ColorPicker.module.scss";

const COLORS: Record<string, string> = {
	red: "#e5534b",
	orange: "#e0823d",
	yellow: "#d4a72c",
	green: "#57ab5a",
	cyan: "#39c5cf",
	blue: "#539bf5",
	purple: "#b083f0",
	pink: "#e275ad",
};

export const metaColor = (meta: Meta) => COLORS[String(meta.color)] ?? "var(--accent)";

export function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
	return (
		<div className={styles.swatches}>
			<button
				type="button"
				title="No color"
				className={`${styles.swatch} ${styles.none} ${value ? "" : styles.on}`}
				onClick={() => onChange("")}
			>
				<Icon name="circle-slash" />
			</button>
			{Object.entries(COLORS).map(([c, hex]) => (
				<button
					type="button"
					key={c}
					title={c}
					className={`${styles.swatch} ${value === c ? styles.on : ""}`}
					style={{ background: hex }}
					onClick={() => onChange(c)}
				/>
			))}
		</div>
	);
}
