# Claude Helper

A friendly VS Code UI for your project and global Claude Code setup, with notifications and commit messages written by Claude.

## Features

- **Project / Global switch** — every tab below works on either the current project (`<workspace>/.claude`) or your global `~/.claude`.
- **Agents** — browse, create, edit and delete subagents, with color and icon pickers.
- **Skills** — browse and edit skills and their files.
- **CLAUDE.md** — edit instructions with a Markdown preview.
- **Memory** — browse Claude Code's auto memory notes (`~/.claude/projects/<project>/memory`).
- **Permissions** — manage `allow`, `ask` and `deny` rules with a rule builder. Project rules are stored in `.claude/settings.local.json`, global ones in `settings.json`.
- **Plugins** — manage Claude Code plugins (global only).
- **Notifications** — choose a sound and popup for each Claude Code event, with a preview.
- **Commits** — set up the instructions, model and options for commit messages.
- **Bell in the status bar** — mute or unmute all notifications in one click.
- **✨ in Source Control** — write the commit message with Claude.

## Install

Download the `.vsix` from [Releases](https://github.com/fristaylo/claude-helper/releases) and run
**Extensions: Install from VSIX…**. After that the extension updates itself.

Commits need the [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI installed.

## Credits

Notification sounds: Kenney (kenney.nl, CC0) — Interface, Impact and Music Jingles packs; the rest are synthesized for this project.
