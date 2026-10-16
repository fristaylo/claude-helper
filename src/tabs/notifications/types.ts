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
