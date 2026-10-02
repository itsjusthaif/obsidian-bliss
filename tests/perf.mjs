// Static performance audit of theme.css: flags selector and paint patterns that are costly in large vaults.
// Usage: node tests/perf.mjs
import { readFileSync } from "node:fs";

const raw = readFileSync("theme.css", "utf8");
const css = raw.replace(/\/\*[\s\S]*?\*\//g, "");
const count = re => (css.match(re) ?? []).length;

const rules = [...css.matchAll(/([^{};]+)\{([^{}]*)\}/g)].map(m => ({ sel: m[1].trim(), body: m[2] }));
const metrics = {
  rules: rules.length,
  important: count(/!important/g),
  // Subject (last compound) is "*" or an unscoped universal, which matches every element.
  universalSubject: rules.filter(r => r.sel.split(",").some(s => /(^|[\s>+~])\*(::\w+)?\s*$/.test(s.trim()))).length,
  has: count(/:has\(/g),
  notChains: rules.filter(r => /(:not\([^)]*\)){3,}/.test(r.sel)).length,
  descendantDepth: rules.filter(r => r.sel.split(",").some(s => s.trim().split(/\s+/).length > 7)).length,
  backdropFilter: count(/backdrop-filter\s*:/g),
  filter: count(/(^|[;{\s])filter\s*:/g),
  boxShadows: count(/box-shadow\s*:/g),
  gradients: count(/(linear|radial|conic)-gradient\(/g),
  transitionAll: count(/transition\s*:\s*all\b/g),
  willChange: count(/will-change\s*:/g),
};
const limits = { universalSubject: 0, has: 25, notChains: 10, descendantDepth: 5, backdropFilter: 0, filter: 5, transitionAll: 0, willChange: 0 };

let errors = 0;
for (const [k, v] of Object.entries(metrics)) {
  const lim = limits[k];
  const bad = lim !== undefined && v > lim;
  if (bad) errors++;
  console.log(`${bad ? "FAIL" : "ok  "} ${k.padEnd(18)} ${String(v).padStart(5)}${lim !== undefined ? `  (limit ${lim})` : ""}`);
}

const heavy = rules.map(r => ({ sel: r.sel.slice(0, 90), n: (r.body.match(/(linear|radial|conic)-gradient\(/g) ?? []).length + (r.body.match(/box-shadow/g) ?? []).length }))
  .filter(r => r.n >= 6).sort((a, b) => b.n - a.n).slice(0, 5);
if (heavy.length) console.log("\nrules with many gradient/shadow layers:\n" + heavy.map(r => `  ${r.n}  ${r.sel}`).join("\n"));

console.log(`\nperf: ${errors} over-limit metric(s)`);
process.exit(errors ? 1 : 0);
