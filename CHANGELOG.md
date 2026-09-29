# Changelog

## 0.3.1

- Fixed self-update: the downloaded `.vsix` was never installed ("No Servers"). Versions up to 0.3.0 cannot update
  themselves, install this one manually once

## 0.3.0

- Agents: icon picker (stored as `icon` in the frontmatter) and effort level (`effort`: low, medium, high, xhigh,
  max or inherit)
- Commits: effort level for `claude -p` (`claudeHelper.commit.effort`), CLI default when empty
- Notifications: per-event volume, vertical slider on hover over the speaker icon
- Notifications: "Task finished" no longer fires while the session waits for background subagents or workflows

## 0.2.0

- Renamed to Claude Helper. The extension ID is now `fristaylo.claude-helper`: uninstall the old
  `fristaylo.claude-agents` manually. Settings moved from `claudeAgents.*` to `claudeHelper.*`
- Notifications: sound and popup for Claude Code events (done, permission, question, subagent, commit), per-event
  sound choice from 26 sounds, bell toggle in the status bar
- Commits: generate a commit message with local `claude -p` from the Source Control title, configurable prompt,
  model and Claude path

## 0.1.0

Initial release.

- Side bar and editor-tab UI for the global Claude Code folder
- Agents: create, edit, rename and delete subagents with name, description, model, color, tools and prompt
- CLAUDE.md editor with Markdown preview
- Global `deny` / `ask` / `allow` permission rules: add, edit, move, remove
- Configurable folder (`claudeHelper.configDir`), live reload on external changes
- Self-update from GitHub Releases of [fristaylo/claude-helper](https://github.com/fristaylo/claude-helper)
