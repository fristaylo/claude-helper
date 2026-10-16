import type { Api } from "./host/api";

declare const acquireVsCodeApi: () => { postMessage(message: unknown): void };
const vscode = acquireVsCodeApi();

let seq = 0;
const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
const changeListeners = new Set<() => void>();
const toastListeners = new Set<(t: Toast) => void>();

export interface Toast {
	text: string;
	error?: boolean;
}

window.addEventListener("message", ({ data }) => {
	if (data.type === "changed") {
		for (const l of changeListeners) l();
		return;
	}
	const p = pending.get(data.id);
	if (!p) return;
	pending.delete(data.id);
	if (data.error !== undefined) p.reject(new Error(data.error));
	else p.resolve(data.result);
});

export function call<K extends keyof Api>(method: K, ...params: Parameters<Api[K]>) {
	const id = seq++;
	vscode.postMessage({ id, method, params });
	return new Promise<Awaited<ReturnType<Api[K]>>>((resolve, reject) =>
		pending.set(id, { resolve: resolve as (v: unknown) => void, reject }),
	);
}

export function onChanged(fn: () => void) {
	changeListeners.add(fn);
	return () => {
		changeListeners.delete(fn);
	};
}

export function toast(text: string, error = false) {
	for (const l of toastListeners) l({ text, error });
}

export function onToast(fn: (t: Toast) => void) {
	toastListeners.add(fn);
	return () => {
		toastListeners.delete(fn);
	};
}

export async function run<T>(p: Promise<T>, ok?: string): Promise<T | undefined> {
	try {
		const r = await p;
		if (ok) toast(ok);
		return r;
	} catch (e: unknown) {
		toast(e instanceof Error ? e.message : String(e), true);
	}
}
