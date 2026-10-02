// Redundancy report for theme.css. Usage: node tests/redundancy.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "theme.css"), "utf8");
const lineOf = i => src.slice(0, i).split("\n").length;
const clean = src.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, " "));

// Flatten into { ctx, sel, decls: Map(prop -> value), line }.
const rules = [];
const stack = [];
let buf = "";
for (let i = 0; i < clean.length; i++) {
  const ch = clean[i];
  if (ch === "{") { stack.push({ head: buf.trim(), start: i + 1, line: lineOf(i), hasChild: false }); if (stack.length > 1) stack[stack.length - 2].hasChild = true; buf = ""; }
  else if (ch === "}") {
    const o = stack.pop(); if (!o) continue;
    if (!o.hasChild && !o.head.startsWith("@") ) {
      const ctx = stack.map(s => s.head).join(" > ");
      const decls = new Map();
      for (const d of clean.slice(o.start, i).split(/;(?![^(]*\))/)) {
        const m = d.trim().match(/^([-\w]+)\s*:\s*([\s\S]+)$/); if (m) decls.set(m[1], m[2].replace(/\s+/g, " ").trim());
      }
      rules.push({ ctx, sel: o.head.replace(/\s+/g, " "), decls, line: o.line });
    }
    buf = "";
  } else if (ch === ";") buf = ""; else buf += ch;
}

const out = [];
// 1. Same selector + context declared repeatedly: later props override earlier ones.
const bySel = new Map();
for (const r of rules) { const k = r.ctx + "|" + r.sel; (bySel.get(k) ?? bySel.set(k, []).get(k)).push(r); }
for (const [, list] of bySel) {
  if (list.length < 2) continue;
  const lastSeen = new Map();
  for (const r of list) {
    for (const [p, v] of r.decls) {
      const prev = lastSeen.get(p);
      if (prev && !v.includes("!important") === !prev.v.includes("!important")) out.push(`OVERRIDDEN  line ${prev.line} ${p}: ${prev.v.slice(0, 40)}  ->  line ${r.line} "${v.slice(0, 40)}"  [${r.sel.slice(0, 60)}]`);
      lastSeen.set(p, { v, line: r.line });
    }
  }
}
// 2. Identical declaration bodies under different selectors (merge candidates).
const byBody = new Map();
for (const r of rules) {
  if (r.decls.size < 3) continue;
  const k = r.ctx + "|" + [...r.decls].map(([p, v]) => p + ":" + v).sort().join(";");
  (byBody.get(k) ?? byBody.set(k, []).get(k)).push(r);
}
for (const [, list] of byBody) if (list.length > 1) out.push(`SAME BODY   lines ${list.map(r => r.line).join(", ")}  [${list.map(r => r.sel.slice(0, 40)).join(" | ")}]`);
// 3. Custom properties defined but never used.
const defs = new Map();
for (const m of clean.matchAll(/(--[\w-]+)\s*:/g)) if (!defs.has(m[1])) defs.set(m[1], lineOf(m.index));
const settingsIds = [...src.matchAll(/^\s*id:\s*(\S+)/gm)].map(m => "--" + m[1]);
for (const [v, line] of defs) {
  const uses = [...clean.matchAll(new RegExp("var\\(\\s*" + v + "(?![\\w-])", "g"))].length;
  if (!uses && v.startsWith("--bp-") && !settingsIds.includes(v)) out.push(`UNUSED VAR  line ${line} ${v}`);
}
// 4. Redundant !important on selectors already using the body:not(#bp-x) specificity hack.
let imp = 0; for (const r of rules) if (r.sel.includes("#bp-x")) for (const v of r.decls.values()) if (v.includes("!important")) imp++;

for (const o of out) console.log(o);
console.log(`\nredundancy: ${out.length} finding(s); ${rules.length} rules; ${imp} !important declarations under #bp-x hack`);
