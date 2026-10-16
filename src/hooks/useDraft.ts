import { type Dispatch, type SetStateAction, useState } from "react";

export function useDraft<T>(disk: T): {
	draft: T;
	setDraft: Dispatch<SetStateAction<T>>;
	dirty: boolean;
	markSaved: (value: T) => void;
} {
	const [draft, setDraft] = useState(disk);
	const [saved, setSaved] = useState(disk);
	const [seen, setSeen] = useState(disk);
	if (!same(disk, seen)) {
		if (same(draft, saved)) setDraft(disk);
		setSeen(disk);
		setSaved(disk);
	}
	return { draft, setDraft, dirty: !same(draft, saved), markSaved: setSaved };
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
