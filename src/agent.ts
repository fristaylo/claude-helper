import { parse, stringify } from "yaml";
import type { Agent, Meta } from "./shared";

function parseFrontmatter(src: string): Meta {
	try {
		const meta = parse(src);
		if (meta && typeof meta === "object" && !Array.isArray(meta)) return meta;
	} catch {}
	const meta: Meta = {};
	let key = "";
	for (const line of src.split(/\r?\n/)) {
		const m = /^([A-Za-z_][\w-]*):(.*)$/.exec(line);
		if (m) {
			key = m[1];
			meta[key] = m[2].trim();
		} else if (key) meta[key] = `${meta[key]}\n${line}`;
	}
	return meta;
}

export function parseAgent(file: string, text: string): Agent {
	const m = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)([\s\S]*)$/.exec(text);
	if (!m) return { file, meta: {}, prompt: text.trim() };
	return { file, meta: parseFrontmatter(m[1]), prompt: m[2].trim() };
}

export function serializeAgent(meta: Meta, prompt: string) {
	const clean = Object.fromEntries(
		Object.entries(meta).filter(([, v]) => v != null && v !== "" && !(Array.isArray(v) && !v.length)),
	);
	return `---\n${stringify(clean, { lineWidth: 0 })}---\n\n${prompt.trim()}\n`;
}
