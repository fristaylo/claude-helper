import assert from "node:assert/strict";
import { parseAgent, serializeAgent } from "./agent";

const claudeGenerated = String.raw`---
name: code-reviewer
description: Use this agent after code changes. Examples:\n\n<example>\nContext: The user wrote a function.\nuser: "review it"\n</example>
tools: Read, Grep, Glob
model: sonnet
color: blue
---

You are a reviewer.
`;
const a = parseAgent("code-reviewer.md", claudeGenerated);
assert.equal(a.meta.name, "code-reviewer");
assert.match(String(a.meta.description), /^Use this agent.*<\/example>$/);
assert.equal(a.meta.tools, "Read, Grep, Glob");
assert.equal(a.prompt, "You are a reviewer.");

const custom = { ...a.meta, color: "", tools: "", memory: "project", hooks: { Stop: [] } };
const b = parseAgent("x.md", serializeAgent(custom, "Line 1\n\nLine: 2"));
assert.deepEqual(b.meta, {
	name: "code-reviewer",
	description: a.meta.description,
	model: "sonnet",
	memory: "project",
	hooks: { Stop: [] },
});
assert.equal(b.prompt, "Line 1\n\nLine: 2");

assert.deepEqual(parseAgent("y.md", "just a prompt").meta, {});
assert.equal(parseAgent("z.md", "---\r\nname: z\r\ndescription: d\r\n---\r\nbody\r\n").meta.name, "z");
console.log("agent.check: ok");
