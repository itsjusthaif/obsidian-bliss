# Contributing to Bliss

Thanks for helping. Anyone can propose a change; only the owner merges and releases.

## Reporting a problem

Open an issue with the bug report form. Include your Bliss and Obsidian versions, a screenshot, and whether it still happens with other themes and CSS snippets disabled.

## Proposing a change

1. Fork the repo and create a branch from `dev` (for example `fix/dialog-padding`).
2. Edit `theme.css`. It is the only file that ships, together with `manifest.json`.
3. Run `npm test`. It lints the CSS, runs a static performance audit and checks that finished features are still present. CI runs the same checks.
4. For a user-visible change, add one line under `## [Unreleased]` in `CHANGELOG.md` (Added, Changed or Fixed).
5. Open a pull request against `dev` with a short description and, for visual changes, a before and after screenshot.

Use the commit prefixes `feat:`, `fix:`, `docs:` and `chore:`. Keep pull requests focused: one fix or feature each.

## Optional checks that need Obsidian

These are not run in CI. They need Obsidian started with `--remote-debugging-port=9222`:

- `npm run live`: contrast, clipping and hit-target audit.
- `npm run parity`: checks that dark mode has no light surfaces left.
- `npm run perf:live`: runtime performance comparison.
- `npm run visual`: screenshot comparison. Baselines are stored in `tests/snapshots`, which is git-ignored, so the first run creates your own.
- `npm run selectors`: checks the Obsidian classes the theme uses against your installed Obsidian. It looks for Obsidian in the Windows install folders; on other systems pass `--asar <path>`.

## Branches and releases

- `main` is the released state and `dev` collects finished work for the next release. Contributors branch from and target `dev`.
- The owner reviews, merges and publishes releases. Releases are tagged `X.Y.Z` (no `v` prefix, matching `manifest.json`) on `main`, and a workflow creates the GitHub release.
- `npm run setup` enables optional local git hooks that refuse direct commits to `main` and `dev`; `npm run task -- <feature|fix|chore|docs>/<name>` starts a branch from `dev`.

## Guidelines

- Use the theme's `--bp-` variables rather than hard-coded colours where one exists.
- Do not use third-party artwork or personal content in screenshots.
- Be kind. Reviews are about the change, not the person.
