# Bliss: working agreements

Bliss is an Obsidian theme. The shipped files are `theme.css` and `manifest.json`; everything else is repo tooling.

## Tracking changes

- Every user-visible change adds one line under `## [Unreleased]` in `CHANGELOG.md` in the same commit (headings: Added, Changed, Fixed). Tooling, tests and docs changes are not logged.
- Commit messages start with a prefix: `feat:`, `fix:`, `docs:`, `chore:`. Add `Fixes #N` when a GitHub issue is closed.
- Never log work that was reverted.

## Versions

- Patch (1.0.x): bug fixes and visual corrections only.
- Minor (1.x.0): a new feature or Style Settings option, or a newly styled plugin.
- Major (x.0.0): breaking change, such as removing or renaming a `bp-` setting id.

## Branches

- `main` is the released state. Only `main` is tagged.
- Work goes on `dev` (or `feature/<name>`) and is merged into `main` when a release is ready.
- Do not force-push `main`. Do not move or rewrite a tag once a GitHub release exists; ship a new patch instead.

## Release routine

1. Move `[Unreleased]` entries under a new `## [X.Y.Z]` heading and add a fresh empty `[Unreleased]`.
2. Bump `version` in `manifest.json` and `package.json` (they must match).
3. `npm test` and `npm run release-check` pass.
4. Merge to `main`, then tag `vX.Y.Z` and push the tag. The `Release` workflow creates the GitHub release with `theme.css`, `manifest.json` and the changelog section as notes.

## Feature releases (minor and major)

- Add cascaded showcase images in `docs/Images/releases/vX.Y.0/`, using the same rounded beige desk panel with overlapping windows as the README images.
- Capture them from the dummy-content demo vault only, never from a personal vault. Only dummy content may appear in a screenshot, and no third-party artwork such as the Microsoft XP wallpaper.
- Embed the image in the release notes and link the latest one from the README under "What's new".
- Update README file as needed with latest cascade images of sections that were pre-existing. 

## Bug fixes

- Track bugs as GitHub Issues (templates in `.github/ISSUE_TEMPLATE`). Batch small fixes into a patch release; release at once only if something is badly broken.
- Patch releases need only the changelog entry, no showcase images.

## Safety

- Commit only the files being worked on, and never revert or overwrite uncommitted edits to `theme.css`.
- Pushing, tagging and deleting need the owner's go-ahead.
- Commit identity is the GitHub noreply address already set in this repo's local git config.
