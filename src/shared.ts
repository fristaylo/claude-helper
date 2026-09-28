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

export type NotifyEvent = "done" | "permission" | "question" | "subagent" | "commit";
export const NOTIFY_EVENTS: NotifyEvent[] = ["done", "permission", "question", "subagent", "commit"];
export interface EventConfig {
	sound: boolean;
	popup: boolean;
	file: string;
}
export interface NotifySettings {
	enabled: boolean;
	events: Record<NotifyEvent, EventConfig>;
	sounds: string[];
}
export interface NotifyPatch {
	enabled?: boolean;
	events?: Partial<Record<NotifyEvent, EventConfig>>;
}
export type CommitModel = "haiku" | "sonnet" | "opus";
export const COMMIT_MODELS: CommitModel[] = ["haiku", "sonnet", "opus"];
export interface CommitSettings {
	prompt: string;
	model: CommitModel;
	claudePath: string;
	untracked: boolean;
}
