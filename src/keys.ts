import type { KeyboardEvent } from "react";

export function onSaveKey(save: () => void) {
	return (e: KeyboardEvent) => {
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
			e.preventDefault();
			save();
		}
	};
}
