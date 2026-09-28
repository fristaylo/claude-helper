export type Meta = Record<string, unknown>;
export type Kind = "deny" | "ask" | "allow";
export type Rules = Record<Kind, string[]>;
export interface Agent {
	file: string;
	meta: Meta;
	prompt: string;
}

export const KINDS: Kind[] = ["deny", "ask", "allow"];
export const AGENT_NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
