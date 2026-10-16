import type { Meta } from "../../shared";

export interface Skill {
	name: string;
	meta: Meta;
	body: string;
	files: string[];
}

export const skillName = (s: Skill) => String(s.meta.name || s.name);
