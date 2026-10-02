# Changelog

## [Unreleased]

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
