import { useEffect, useState } from "react";
import { Icon } from "../../icons";
import { type Toast, onToast } from "../../rpc";
import styles from "./Toaster.module.scss";

export function Toaster() {
	const [toast, setToast] = useState<Toast & { key: number }>();
	useEffect(() => {
		let timer: ReturnType<typeof setTimeout>;
		const off = onToast((t) => {
			clearTimeout(timer);
			setToast({ ...t, key: Date.now() });
			timer = setTimeout(() => setToast(undefined), t.error ? 5000 : 2200);
		});
		return () => {
			off();
			clearTimeout(timer);
		};
	}, []);
	if (!toast) return null;
	return (
		<output key={toast.key} className={`${styles.toast} ${toast.error ? styles.error : ""}`}>
			<Icon name={toast.error ? "error" : "check"} />
			{toast.text}
		</output>
	);
}
