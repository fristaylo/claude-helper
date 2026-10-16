import assert from "node:assert/strict";
import { indexAdd, indexRemove, indexRename, slug } from "../tabs/memory/memoryIndex";
import { parseAgent, serializeAgent } from "./frontmatter";

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

assert.equal(slug(String.raw`c:\Users\andru\Desktop\claude-helper`), "c--Users-andru-Desktop-claude-helper");

assert.equal(indexAdd(null, "a", "a.md", "desc"), "- [a](a.md) — desc\n");
assert.equal(
	indexAdd("- [a](a.md) — x", "b", "b.md", "two\nlines"),
	"- [a](a.md) — x\n- [b](b.md) — two lines\n",
);
assert.equal(
	indexRename("- [a](a.md) — x\n- [b](b.md) — y\n", "a.md", "c.md"),
	"- [a](c.md) — x\n- [b](b.md) — y\n",
);
assert.equal(indexRemove("- [a](a.md) — x\n- [b](b.md) — y\n", "a.md"), "- [b](b.md) — y\n");
console.log("check: ok");
