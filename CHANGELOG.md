# Changelog

## [Unreleased]

### Added

- Style Settings: new accent colour Embedded, sampled from the Windows XP Embedded theme.
- Style Settings: new Dark style option Auto (follows accent), now the default. Zune pairs with XP Royale Dark and Embedded with Midnight; every other accent keeps Slate. Picking a dark style yourself always overrides it.
- Style Settings: new Dark style option XP Royale Dark, a neutral charcoal look with glossy split-shine buttons and tabs after the XP Royale theme.
- Dark mode: Luna Blue now becomes Royale Energy Blue and Silver becomes Royale Noir, so each light accent has an XP-era dark companion.
- Style Settings: two bonus pre-release accents from Windows XP build 2419 (Whistler, Mallard style): Chartreuse Mongoose (green with golden highlights) and Blue Lagoon (teal with purple highlights).

### Changed

- The Orange accent is now called Zune and uses the orange sampled from the XP Zune theme. Saved settings keep working.
- The Silver accent is lighter and lavender-tinted, with light Metallic title bars and dark title text in light mode, closer to the XP Metallic theme.
- Notes list background and Note background fade are now light mode only, because they made almost no visible difference in dark. Dark mode always uses its fixed list gradient and a flat note, and the option descriptions say so.

### Fixed

- Editing view: the underline below a heading is no longer covered by inline code in that heading.

## [1.2.0]

### Added

- Style Settings: new Dark style option with Slate (the current look), Midnight (deep blue-black) and Contrast (near-black, brighter borders and text, clear focus rings). Midnight and Contrast add layered shadows to menus, dialogs and the active tab, and an accent glow on focused fields.
- Style Settings: new Auto-hide status bar toggle that slides the bottom-right status bar out of view and back on hover with a smooth glide (thanks to @rcegan, #1).

### Changed

- Dark mode: the desk texture dots are slightly more visible on Slate, blue-tinted on Midnight and fainter on Contrast.
- Dark mode: the note and list pane are now a lighter shade than the sidebars and window chrome, so the working surfaces feel raised. Properties, callouts, selected note card, hover and calendar colours, and muted text were retuned for the lighter surface.
- Cleaner stylesheet for the community theme checks: most `!important` rules replaced with higher selector specificity, and the unused `:has()` code block rule removed. No visual change intended.

### Fixed

- Dark mode: unresolved links are now readable, and calendar weekend cells use a subtle shade instead of a heavy block.
- Narrow windows: the sidebars now shrink and the note keeps a minimum width, so the right sidebar's tab icons no longer slide under the minimise, maximise and close buttons.
- Top row alignment: the left sidebar tab strip now uses the same height as the note tab bar and the ribbon, so the lines across the top line up.
- Notebook Navigator calendar year view: the current month is a filled accent cell again, so its white label is readable.

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

- Smaller stylesheet: removed overridden declarations, empty rules and unused variables, with no visual change.

## [1.0.1]

- Fixed the bottom border of expanded date groups in the notes list.
- Fixed dialog padding so any content is inset consistently; large sidebar modals such as the community plugin browser keep their full width.
- Settings search band and active sidebar item now match the card and accent colours; selected plugin card has a border.
- Lighter, faster toggle hover and press feedback.
- Destructive buttons use the raised red Luna style.

## [1.0.0]

- Initial release: Luna chrome, accent presets (Luna Blue, Olive, Silver, Orange), slate dark mode.
- Styling for Notebook Navigator, Obsidian Git, properties, callouts, dialogs and scrollbars.
- Windows XP Nostalgia Mode (opt-in taskbar gradient and sunset strips).
- Added perf, selector, release and visual regression checks.
