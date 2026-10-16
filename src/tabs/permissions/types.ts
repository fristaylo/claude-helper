export type Kind = "deny" | "ask" | "allow";
export type Rules = Record<Kind, string[]>;

export const KINDS: Kind[] = ["deny", "ask", "allow"];
export const KIND_INFO: Record<Kind, { label: string; icon: string; hint: string; color: string }> = {
	deny: {
		label: "Deny",
		icon: "circle-slash",
		hint: "Always blocked, even if allowed somewhere else.",
		color: "var(--deny)",
	},
	ask: {
		label: "Ask",
		icon: "question",
		hint: "Claude asks for confirmation every time.",
		color: "var(--ask)",
	},
	allow: { label: "Allow", icon: "pass", hint: "Runs without asking.", color: "var(--allow)" },
};
