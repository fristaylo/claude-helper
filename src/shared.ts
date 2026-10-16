export type Meta = Record<string, unknown>;
export type Scope = "project" | "global";

export const AGENT_NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const EFFORTS = ["low", "medium", "high", "xhigh", "max"];
