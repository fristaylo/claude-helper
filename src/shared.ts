export type Meta = Record<string, unknown>;
export type Kind = "deny" | "ask" | "allow";
export type Rules = Record<Kind, string[]>;
export type Scope = "project" | "global";
export interface Agent {
	file: string;
	meta: Meta;
	prompt: string;
}
export interface Skill {
	name: string;
	meta: Meta;
	body: string;
	files: string[];
}
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
export interface ScopeState {
	dir: string;
	claudeMd: string | null;
	agents: Agent[];
	skills: Skill[];
	rules: Rules;
	settingsFile: string;
	settingsError?: string;
}
export interface Plugin {
	id: string;
	name: string;
	marketplace: string;
	version: string;
	enabled: boolean;
	description: string;
}
export interface Marketplace {
	name: string;
	source: string;
	plugins: number;
}
export interface CatalogEntry {
	name: string;
	marketplace: string;
	description: string;
	category?: string;
	installed: boolean;
}
export interface PluginsState {
	installed: Plugin[];
	marketplaces: Marketplace[];
	catalog: CatalogEntry[];
}

export const KINDS: Kind[] = ["deny", "ask", "allow"];
export const AGENT_NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const MEMORY_TYPES = ["user", "feedback", "project", "reference"];
export const MEMORY_NAME = /^[a-z0-9]+([-_][a-z0-9]+)*$/i;
export const EFFORTS = ["low", "medium", "high", "xhigh", "max"];

export type NotifyEvent = "done" | "permission" | "question" | "subagent" | "commit";
export const NOTIFY_EVENTS: NotifyEvent[] = ["done", "permission", "question", "subagent", "commit"];
export interface EventConfig {
	sound: boolean;
	popup: boolean;
	file: string;
	volume: number;
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
	effort: string;
	claudePath: string;
	untracked: boolean;
}
