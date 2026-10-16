export const slug = (path: string) => path.replace(/[^A-Za-z0-9]/g, "-");

export function indexAdd(text: string | null, title: string, file: string, description: string) {
	const line = `- [${title}](${file}) — ${description.replace(/\s+/g, " ").trim()}\n`;
	if (!text) return line;
	return (text.endsWith("\n") ? text : `${text}\n`) + line;
}

export function indexRename(text: string, oldFile: string, newFile: string) {
	return text.split(`](${oldFile})`).join(`](${newFile})`);
}

export function indexRemove(text: string, file: string) {
	return text
		.split("\n")
		.filter((line) => !line.includes(`](${file})`))
		.join("\n");
}
