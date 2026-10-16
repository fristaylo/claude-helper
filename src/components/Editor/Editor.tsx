import type { TextareaHTMLAttributes } from "react";
import styles from "./Editor.module.scss";

export function Editor({
	compact,
	className = "",
	spellCheck = false,
	...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { compact?: boolean }) {
	return (
		<textarea
			{...rest}
			spellCheck={spellCheck}
			className={`${styles.editor} ${compact ? styles.compact : ""} ${className}`}
		/>
	);
}
