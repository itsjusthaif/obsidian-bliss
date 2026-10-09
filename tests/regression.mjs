// Fails when rules for finished features are missing from theme.css (for example after an overwrite or a bad merge).
// Usage: node tests/regression.mjs [file]
// When a feature is removed on purpose, delete its markers from this list in the same commit.
import { readFileSync } from "node:fs";

const MARKERS = {
  "code blocks": ["Code blocks: classic sunken frame", ".HyperMD-codeblock-begin", "--code-keyword: #0000ff"],
  "heading spacing": ["Space under headings equals the reading-view block margin"],
  "top strip height": ["--bp-strip-h: var(--header-height", "height: var(--bp-strip-h)"],
  "calendar year current month": ["nn-navigation-calendar-year-month.is-current-month"],
  canvas: ["Canvas: XP window cards", ".canvas-group-label", "--canvas-color-5"],
  "graph (dark)": ["--graph-node-focused", "--graph-line: color-mix"],
  "dialog width": [":where(.modal:not(.mod-settings):not(.mod-sidebar-layout))", ".vertical-tab-content .setting-item-info"],
  "primary button pressed state": ["button.mod-cta:active"],
  tasknotes: [".mod-tasknotes", ".tn-task-modal__open-note-button", ".pomodoro-view__start-button", ".tasknotes-plugin .metadata-container", "--interactive-accent: var(--bp-accent-top)"],
  "xp accents": ["body.bp-accent-embedded {", "body.bp-accent-whistler-chartreuse {", "body.bp-accent-whistler-lagoon {", "body.bp-accent-orange {", "label: Zune", "body[class*=\"bp-accent-\"]:not(.bp-accent-luna)", "body.theme-dark.bp-accent-silver {", "body.theme-light.bp-accent-silver {", "--bp-header-text:"],
  "dark elevation": ["--bp-paper: #3e444e;", "--bp-panel: #2f343b;", "--bp-list-top: #434953;", "--bp-text-muted: #bec5d0;"],
  "light-only list and note options": ["description: Light mode only. Background of the middle", "description: Light mode only. Soft top-to-bottom tint"],
  "dark style": ["id: bp-dark-style", "body.theme-dark.bp-dark-midnight {", "body.theme-dark.bp-dark-contrast {", "--bp-lift:"],
  "classic window shadow": ["box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.3);", "--bp-lift:"],
  "small controls": ["Small controls: balloon notices", ".progress-bar-indicator", "--bp-balloon-bg:", "--checkbox-color: #3a9a3a;", "section.footnotes"],
  "dark style": ["id: bp-dark-style", "body.theme-dark.bp-dark-midnight,", "body.theme-dark.bp-dark-contrast {", "body.theme-dark.bp-dark-royale,", "body.theme-dark.bp-dark-auto.bp-accent-orange {", "body.theme-dark.bp-dark-auto.bp-accent-embedded {", "value: bp-dark-auto", "--bp-lift:"],
  "nostalgia taskbar": ["Nostalgia taskbar: the vault switcher is the Start button", "--bp-start-mid:", ".workspace-sidedock-vault-profile {", "body.bp-xp-nostalgia:not(#bp-x) .status-bar .status-bar-item.mod-clickable:active"],
  "auto-hide status bar": ["id: bp-hide-status-bar", "body.bp-hide-status-bar .status-bar {", "body.bp-hide-status-bar .status-bar:hover {", "--bp-reveal-speed: 450ms;"],
};

const css = readFileSync(process.argv[2] ?? "theme.css", "utf8");
let missing = 0;
for (const [feature, marks] of Object.entries(MARKERS)) {
  const lost = marks.filter(m => !css.includes(m));
  if (lost.length) { missing += lost.length; console.error(`FAIL ${feature}: missing ${lost.map(m => JSON.stringify(m)).join(", ")}`); }
}
const opens = (css.match(/{/g) ?? []).length, closes = (css.match(/}/g) ?? []).length;
if (opens !== closes) { missing++; console.error(`FAIL braces unbalanced: ${opens} { vs ${closes} }`); }
if (!/}\r?\n$/.test(css)) { missing++; console.error("FAIL theme.css does not end with a closed rule and a newline (truncated?)"); }
console.log(missing ? `regression: ${missing} problem(s)` : `regression: all ${Object.values(MARKERS).flat().length} markers present`);
process.exit(missing ? 1 : 0);
