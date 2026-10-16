import type { InputHTMLAttributes } from "react";
import styles from "./Checkbox.module.scss";

export function Checkbox({ className = "", ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
	return <input {...rest} type="checkbox" className={`${styles.check} ${className}`} />;
}
