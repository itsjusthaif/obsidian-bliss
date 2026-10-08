![Bliss banner](docs/Images/banner.png)

Obsidian, but it's 2001. Bevelled buttons, Luna blues and the gloriously boring look of the early web.

Bliss is a desktop theme for [Obsidian](https://obsidian.md/) that draws inspiration from the early web and classic Windows aesthetics. Glossy blues, soft greens, and a warm beige desktop create a familiar sense of nostalgia, while layouts echo the tidy structure of intranet portals and personal websites from the Y2K era. A slate dark mode is included for after-hours work. Bliss brings together retro charm and modern usability in a contemporary take on early 2000s design.

Inspired by: [Fernando Borretti on X](https://x.com/zetalyrae/status/2046805336137294294), [boringpunk-notes-app](https://github.com/eudoxia0/etudes/tree/cc2088d92ab9cb09890dd1d3488c0d5915304eab/html/boringpunk-notes-app)

## Contents

- [Screenshots](#screenshots)
- [Installation](#installation)
- [Companion plugins](#companion-plugins)
- [Settings](#settings)
- [Plugin support](#plugin-support)
- [Customizing](#customizing)
- [Development](#development)
- [Changelog](#changelog)
- [License](#license)
- [Disclaimer](#disclaimer)

## Screenshots

Light and dark modes

![Light and dark](docs/Images/bliss-light-dark.png)

XP accent presets: Luna Blue, Olive Green, Silver and Orange

![Accent presets](docs/Images/bliss-accents.png)

![Accent presets, dark](docs/Images/bliss-accents-dark.png)

Windows XP Nostalgia Mode, on and off

![XP Nostalgia Mode off and on](docs/Images/bliss-xp-nostalgia.png)

Classic square corners, on and off

![Classic square corners off and on](docs/Images/bliss-classic-square.png)

Callouts, tables and classic sunken Luna frame code blocks with VS-style syntax colours

![Notes](docs/Images/bliss-notes.png)

Extended Style Settings

![Controls](docs/Images/bliss-controls.png)

## Installation
To install the theme

- Open Obsidian Settings
- Go to `Appearance` and click `Manage`
- Under community themes search for "Bliss" and click `Use`

To install manually, download and copy `theme.css` and `manifest.json` into `<vault>/.obsidian/themes/Bliss/`, then select Bliss under **Appearance**.

## Companion plugins

- [Style Settings](https://community.obsidian.md/plugins/obsidian-style-settings) unlocks every option listed below. [Recommended for all users of Bliss]
- [Notebook Navigator](https://community.obsidian.md/plugins/notebook-navigator) [Recommended]

## Settings

All options live in Style Settings under **Bliss**.

| Setting | What it does |
| --- | --- |
| Accent colour | Luna Blue, Olive Green, Silver, Orange, or your Obsidian accent colour |
| Notes list background | Flat, warm paper or cream behind the Notebook Navigator list |
| Note background fade | Soft top-to-bottom tint behind the open note |
| Interface text size | 10 to 14 px for labels, buttons, sidebars and menus |
| Classic square corners | Square boxes, pills and buttons for the original intranet look |
| Disable desk texture | Removes the fine dot pattern from the window chrome and ribbon |
| Auto-hide status bar | Slides the bottom-right status bar out of view; hover the corner to reveal it |
| Toggle switches follow the accent | Off keeps the classic XP green for switched-on toggles |
| Windows XP Nostalgia Mode | Curved taskbar shading on pane headers, dialog title bars, primary buttons, sliders and accent toggles, plus sunset-orange strips on list date groups and Git sections. Off keeps the original look |

## Plugin support

Bliss styles these directly:

- [Notebook Navigator](https://github.com/johansan/notebook-navigator), including the calendar
- [Obsidian Git](https://github.com/Vinzent03/obsidian-git)
- [TaskNotes](https://github.com/callumalpass/tasknotes) and [Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks)
- Canvas and Graph view, code blocks, properties panel, embedded backlinks and callouts (core Obsidian)

Most other plugins work, but are not themed specifically.

## Customizing

To preview every element Bliss styles, copy [docs/Bliss Theme Showcase.md](docs/Bliss%20Theme%20Showcase.md) into a vault.

Colours, gradients, radii and button states are CSS variables prefixed `--bp-` at the top of `theme.css`. Override them in a [CSS snippet](https://help.obsidian.md/Extending+Obsidian/CSS+snippets) to change the look without editing the theme.

## Development

Contributions are welcome. Fork the repo, branch from `dev` and open a pull request; only the owner merges and releases. See [CONTRIBUTING.md](CONTRIBUTING.md).

| Command | What it does |
| --- | --- |
| `npm test` | CSS lint, static performance audit and a check that finished features are still present (also runs in CI) |
| `npm run release-check` | Verifies manifest, changelog, tag and submission files agree (also runs in CI) |
| `npm run live` | Contrast, clipping and hit-target audit; needs Obsidian running with `--remote-debugging-port=9222` |
| `npm run parity` | Checks that dark mode has no light surfaces left; needs the same running Obsidian |
| `npm run perf:live` | Runtime performance comparison; needs the same running Obsidian |
| `npm run visual` | Screenshot comparison against local baselines (git-ignored); `npm run visual:update` resets them |
| `npm run selectors` | Checks the Obsidian classes the theme depends on against the installed Obsidian; `--write` refreshes [docs/internal-selectors.md](docs/internal-selectors.md) |
| `npm run task -- <name>` and `npm run ship` | Optional helpers for task branches and merging into `dev`; `npm run setup` enables the matching git hooks |

## Changelog
## [1.1.0]

### Added

- Code blocks: classic sunken Luna frame and VS-style syntax colours, identical in editing and reading views; the language badge is unchanged.
- Canvas: XP window cards, a desk surface and folder-tab groups; the dark graph view follows the accent colour.

### Fixed

- Headings: the gap under a heading is the same in editing and reading view, and the h1/h2 rule is drawn under the text.
- Light mode: faint text is darker for better contrast.
- Settings: the dropdown and label layout fixes now apply only inside the Settings window.
- TaskNotes Edit task dialog: the Details panel is visible again, the Open note button matches the other buttons, and the task information box no longer takes the Properties panel look.
- Primary buttons (Save and similar) now show a pressed state.
- Plugin dialogs that set their own width are no longer capped at 560px.
- TaskNotes Pomodoro and Statistics: buttons use the Luna look and the Statistics title no longer wraps into a narrow column.
- Dark mode: the accent used by plugins as text and border colour is lighter so it reads on slate.

### Changed

- Smaller stylesheet: removed overridden declarations, empty rules and unused variables, with no visual change

See [CHANGELOG.md](CHANGELOG.md) for complete release notes.

## License

Bliss is licensed under the MIT License. You may modify and redistribute it, but you must keep the copyright and license notice in your CSS file, including any code you extract as a standalone snippet.

## Disclaimer

This theme is provided as is and is designed for my personal use of Obsidian on Windows. As such it is not thoroughly tested across all operating systems, use cases and plugins.
This theme modifies significant parts of the Obsidian interface, so it may break with future updates. It may also be incompatible with other bits of custom CSS you have.

---

Made with ❤️ using [Claude](https://claude.ai).
