// Static checks on theme.css. Usage: node tests/lint.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "theme.css"), "utf8");
const issues = [];
const add = (level, line, msg) => issues.push({ level, line, msg });
const lineOf = i => src.slice(0, i).split("\n").length;

// Blank out comments and strings (keeping newlines) so structural checks are reliable.
let clean = "";
{
  let i = 0;
  while (i < src.length) {
    if (src.startsWith("/*", i)) {
      const end = src.indexOf("*/", i + 2);
      if (end < 0) { add("error", lineOf(i), "unclosed /* comment"); clean += src.slice(i).replace(/[^\n]/g, " "); break; }
      clean += src.slice(i, end + 2).replace(/[^\n]/g, " "); i = end + 2;
    } else if (src[i] === '"' || src[i] === "'") {
      const q = src[i]; let j = i + 1;
      while (j < src.length && src[j] !== q && src[j] !== "\n") j += src[j] === "\\" ? 2 : 1;
      if (src[j] !== q) add("error", lineOf(i), "unterminated string");
      clean += src.slice(i, j + 1).replace(/[^\n]/g, " "); i = j + 1;
    } else clean += src[i++];
  }
}

// Brace and paren balance, plus rule-level checks.
const stack = [];
const rules = []; // { selector, body, line, depth }
let buf = "", bufStart = 0;
for (let i = 0; i < clean.length; i++) {
  const ch = clean[i];
  if (ch === "(") stack.push({ ch, i });
  else if (ch === ")") { if (stack.pop()?.ch !== "(") add("error", lineOf(i), "unmatched )"); }
  else if (ch === "{") {
    stack.push({ ch, i, sel: buf.trim(), bodyStart: i + 1 });
    buf = ""; bufStart = i + 1;
  } else if (ch === "}") {
    const open = stack.pop();
    if (!open || open.ch !== "{") { add("error", lineOf(i), "unmatched }"); continue; }
    rules.push({ selector: open.sel, body: clean.slice(open.bodyStart, i), line: lineOf(open.i), depth: stack.filter(s => s.ch === "{").length });
    buf = ""; bufStart = i + 1;
  } else if (ch === ";") { buf = ""; bufStart = i + 1; }
  else buf += ch;
}
for (const s of stack) add("error", lineOf(s.i), `unclosed ${s.ch}`);

for (const r of rules) {
  const decls = r.body.replace(/\{[^{}]*\}/g, "").split(";").map(d => d.trim()).filter(Boolean);
  if (!r.selector.startsWith("@") && !/\{/.test(r.body) && decls.length === 0) add("warn", r.line, `empty rule: ${r.selector.slice(0, 60)}`);
  if (/\{/.test(r.body)) continue; // container (@media etc.)
  const seen = new Map();
  for (const d of decls) {
    const m = d.match(/^([-\w]+)\s*:\s*([\s\S]+)$/);
    if (!m) { if (d === "content:") continue; if (!r.selector.startsWith("@")) add("warn", r.line, `malformed declaration "${d.slice(0, 50)}" in ${r.selector.slice(0, 50)}`); continue; }
    const [, prop, val] = m;
    if (/\bundefined\b|\bNaN\b|\[object/.test(val)) add("error", r.line, `bad value "${val}" for ${prop}`);
    if (/#[0-9a-f]*\b/i.test(val)) for (const h of val.match(/#[0-9a-f]+\b/gi) ?? []) if (![3, 4, 6, 8].includes(h.length - 1)) add("error", r.line, `invalid hex ${h}`);
    const key = prop;
    if (seen.has(key) && seen.get(key) === val) add("warn", r.line, `duplicate "${prop}: ${val.slice(0, 40)}" in ${r.selector.slice(0, 50)}`);
    seen.set(key, val);
  }
}

// @settings block validation.
const sm = src.match(/\/\*\s*@settings([\s\S]*?)\*\//);
if (!sm) add("error", 1, "no /* @settings block found");
else {
  const base = lineOf(sm.index);
  const block = sm[1];
  if (!/^name:/m.test(block)) add("error", base, "@settings: `name:` must be at column 0 (Style Settings regex ^name:)");
  if (!/^id:/m.test(block)) add("error", base, "@settings: `id:` must be at column 0");
  if (/\t/.test(block)) add("error", base, "@settings: tab characters break YAML");
  for (const m of block.matchAll(/^\s*(?:title|description|label):\s*(?!["'])(.*:\s.*)$/gm)) add("error", lineOf(sm.index + m.index), "@settings: an unquoted value contains ': ' and breaks YAML parsing; reword it or quote the value");
  const ids = [...block.matchAll(/^\s*id:\s*(\S+)/gm)].map(m => m[1]).filter(id => id !== "bliss");
  const classValues = [...block.matchAll(/^\s*value:\s*(\S+)/gm)].map(m => m[1]);
  const body = src.slice(sm.index + sm[0].length);
  const defaults = new Set([...block.matchAll(/^\s*default:\s*(\S+)/gm)].map(m => m[1]));
  for (const v of classValues) if (!defaults.has(v) && !new RegExp("\\." + v + "(?![\\w-])").test(body)) add("error", base, `settings class "${v}" is never used in a selector`);
  const classIds = new Set([...block.matchAll(/id:\s*(\S+)\s*\n\s*title:[^\n]*\n(?:\s*description:[^\n]*\n)?\s*type:\s*(class-toggle)/g)].map(m => m[1]));
  for (const id of classIds) if (!new RegExp("\\." + id + "(?![\\w-])").test(body)) add("error", base, `class-toggle "${id}" is never used in a selector`);
  const varIds = [...block.matchAll(/id:\s*(\S+)\s*\n(?:[^\n]*\n){0,3}?\s*type:\s*variable-/g)].map(m => m[1]);
  for (const id of varIds) if (!body.includes(`--${id}`) && !body.includes(id)) add("error", base, `variable setting "${id}" is never referenced`);
  void ids;
}

// Custom property hygiene: a var() with no fallback must be defined somewhere in the theme or be an Obsidian built-in (checked live in live.mjs).
const defined = new Set([...clean.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]));
const usedNoFallback = new Map();
for (const m of clean.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)) if (!usedNoFallback.has(m[1])) usedNoFallback.set(m[1], lineOf(m.index));
const custom = [...usedNoFallback].filter(([v]) => v.startsWith("--bp-") && !defined.has(v));
for (const [v, line] of custom) add("error", line, `${v} used but never defined`);

issues.sort((a, b) => a.line - b.line);
for (const i of issues) console.log(`${i.level.toUpperCase().padEnd(5)} theme.css:${i.line}  ${i.msg}`);
const errors = issues.filter(i => i.level === "error").length;
console.log(`\nlint: ${errors} error(s), ${issues.length - errors} warning(s); ${rules.length} rules scanned`);
process.exit(errors ? 1 : 0);
