import type { Meta } from "../../shared";

export interface Agent {
	file: string;
	meta: Meta;
	prompt: string;
}

export const agentName = (a: Agent) => String(a.meta.name || a.file.replace(/\.md$/, ""));

export const toolsOf = (meta: Meta) => {
	const t = meta.tools;
	if (Array.isArray(t)) return t.map(String);
	return typeof t === "string"
		? t
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean)
		: [];
};
