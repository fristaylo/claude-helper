import type { ReactNode } from "react";
import styles from "./Count.module.scss";

export function Count({ children }: { children: ReactNode }) {
	return <span className={styles.count}>{children}</span>;
}
