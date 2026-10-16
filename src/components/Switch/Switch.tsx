import type { InputHTMLAttributes } from "react";
import styles from "./Switch.module.scss";

export function Switch({ className = "", ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
	return (
		<input
			{...rest}
			type="checkbox"
			role="switch"
			aria-checked={rest.checked}
			className={`${styles.switch} ${className}`}
		/>
	);
}
