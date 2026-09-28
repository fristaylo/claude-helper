# Claude Agents

A friendly UI for the global Claude Code configuration, right in the VS Code side bar.

- **Agents** — browse, create, edit and delete subagents (`~/.claude/agents/*.md`): name, description, model,
  color, tools and system prompt. Unknown frontmatter fields are kept as is.
- **CLAUDE.md** — edit global memory with a Markdown preview. `Ctrl+S` saves.
- **Permissions** — manage global `deny`, `ask` and `allow` rules in `settings.json`: add with a rule builder,
  edit in place, move between lists, remove. Other settings are left untouched.
- **Folder** — works with `$CLAUDE_CONFIG_DIR` or `~/.claude` by default; pick another folder from the header
  or with the `claudeAgents.configDir` setting.

Changes made outside (by Claude Code or in a text editor) show up automatically. Use the ↗ button in the view
title to open the same UI in a wide editor tab.

## Install and updates

Download the `.vsix` from [Releases](https://github.com/fristaylo/claude-agents/releases) and run
**Extensions: Install from VSIX…**. After that the extension updates itself: on startup it installs a newer
release if there is one and offers to reload the window.

## License

MIT. Claude Code is a product of Anthropic PBC and is not covered by this license.
