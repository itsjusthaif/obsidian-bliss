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
- `dev` collects finished work for the next release.
- Build each new feature on its own `feature/<name>` branch cut from `main`, so a fix on `main` never has to be untangled from half-built work. Merge it into `dev` only when it is finished and working in Obsidian.
- Fixes go on `dev` or on a `fix/<name>` branch. They may share a release with finished features.
- A hotfix branch off `main` (`release/X.Y.Z`) is used only for a real hotfix: the theme is visibly broken or the bug is common. It needs a changelog entry and a version bump, and `main` is merged back into `dev` afterwards.
- Do not force-push `main`. Do not move or rewrite a tag once a GitHub release exists; ship a new patch instead.

## Release cadence

- Release small and often. Do not let a large backlog build up on `dev`.
- Default to one release containing the finished fixes and features, rather than splitting fixes into a separate patch, unless a hotfix is justified as above.
- Never publish a release that has not been loaded and checked in Obsidian.

## Release routine

1. Move `[Unreleased]` entries under a new `## [X.Y.Z]` heading and add a fresh empty `[Unreleased]`.
2. Bump `version` in `manifest.json` and `package.json` (they must match).
3. `npm test` and `npm run release-check` pass.
4. Merge to `main`, then tag `vX.Y.Z` and push the tag. The `Release` workflow creates the GitHub release with `theme.css`, `manifest.json` and the changelog section as notes.

## Feature releases (minor and major)

- Showcase images do not block a release. Publish the release first; the images and README update follow in a separate docs commit.
- Add cascaded showcase images in `docs/Images/releases/vX.Y.0/`, using the same rounded beige desk panel with overlapping windows as the README images.
- Capture them from the dummy-content demo vault only, never from a personal vault. Only dummy content may appear in a screenshot, and no third-party artwork such as the Microsoft XP wallpaper.
- Embed the image in the release notes and link the latest one from the README under "What's new".
- Update the README with the latest cascade images, including sections that already existed, so every README screenshot matches the current look.

## Bug fixes

- Track bugs as GitHub Issues (templates in `.github/ISSUE_TEMPLATE`). Batch small fixes into the next release; use a hotfix only if something is badly broken.
- Fix-only releases need only the changelog entry, no showcase images.

## Standing behaviour (do this automatically)

For every change request, without being asked:

1. Classify it as a feature, fix or non-user-visible change, and say which.
2. Put it on the right branch (`feature/<name>` for new features, `dev` for fixes and tooling).
3. Add the changelog line under `[Unreleased]` for user-visible changes, and use the commit prefix.
4. Run `npm test` before committing `theme.css` changes.
5. When `[Unreleased]` holds enough finished work, or a fix is urgent, say so and propose the next version number and the release steps.
6. Keep the README, `ROADMAP.md` and `CHANGELOG.md` in step with what shipped: tick off or remove finished roadmap items.

## Safety

- Commit only the files being worked on, and never revert or overwrite uncommitted edits to `theme.css`.
- Pushing, tagging and deleting need the owner's go-ahead.
- Commit identity is the GitHub noreply address already set in this repo's local git config.
