import type { ButtonHTMLAttributes, CSSProperties } from "react";
import { Icon } from "../../icons";
import styles from "./Button.module.scss";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: "primary" | "ghost" | "icon";
	danger?: boolean;
	iconOnly?: boolean;
	color?: string;
	icon?: string;
};

export function Button({
	variant,
	danger,
	iconOnly,
	color,
	icon,
	type = "button",
	className = "",
	style,
	children,
	...rest
}: Props) {
	const classes = [
		variant && styles[variant],
		danger && styles.danger,
		iconOnly && styles.iconOnly,
		className,
	];
	return (
		<button
			{...rest}
			type={type}
			className={classes.filter(Boolean).join(" ")}
			style={color ? ({ ...style, "--k": color } as CSSProperties) : style}
		>
			{icon && <Icon name={icon} />}
			{children}
		</button>
	);
}
