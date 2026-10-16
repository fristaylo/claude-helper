import type { Meta } from "../../shared";

export interface MemoryNote {
	file: string;
	meta: Meta;
	body: string;
}
export interface MemoryProject {
	slug: string;
	label: string;
	index: string | null;
	notes: MemoryNote[];
}

export const MEMORY_TYPES = ["user", "feedback", "project", "reference"];
export const MEMORY_NAME = /^[a-z0-9]+([-_][a-z0-9]+)*$/i;
export const TYPE_COLORS: Record<string, string> = {
	user: "var(--vscode-charts-blue, #539bf5)",
	feedback: "var(--ask)",
	project: "var(--allow)",
	reference: "var(--vscode-charts-purple, #b083f0)",
};

export const record = (v: unknown): Record<string, unknown> =>
	typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

export const noteType = (meta: Meta) => String(record(meta.metadata).type ?? meta.type ?? "");

export const noteName = (n: MemoryNote) => String(n.meta.name || n.file.replace(/\.md$/, ""));

export const matches = (n: MemoryNote, needle: string) =>
	`${noteName(n)} ${n.meta.description ?? ""} ${n.file}`.toLowerCase().includes(needle);
