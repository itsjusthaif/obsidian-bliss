// Live UI audit against a running Obsidian started with --remote-debugging-port=9222.
// Usage: node tests/live.mjs [--port 9222] [--title Obsidian] [--quick]
// Checks, per (mode x accent x scene): unresolved theme vars, text contrast, text clipping, tiny hit targets.
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const port = opt("port", "9222"), title = opt("title", "Obsidian"), quick = args.includes("--quick");

const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const t = targets.find(x => x.type === "page" && x.title.includes(title));
if (!t) { console.error("No Obsidian page on debug port. Start Obsidian with --remote-debugging-port=" + port); process.exit(2); }
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = m => { const d = JSON.parse(m.data); pending.get(d.id)?.(d); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const run = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails.exception?.description ?? r.result.exceptionDetails));
  return r.result?.result?.value;
};

// ---- Runs inside Obsidian ----
function audit() {
  const out = [];
  const push = (level, check, where, msg) => out.push({ level, check, where, msg });
  const sig = e => {
    const cls = [...e.classList].filter(c => !/^(is-|mod-active|has-focus)/.test(c)).slice(0, 3).join(".");
    return e.tagName.toLowerCase() + (cls ? "." + cls : "") + (e.parentElement ? " < " + e.parentElement.tagName.toLowerCase() + (e.parentElement.classList[0] ? "." + e.parentElement.classList[0] : "") : "");
  };
  const visible = e => {
    const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false;
    const c = getComputedStyle(e); return c.visibility !== "hidden" && c.display !== "none" && +c.opacity > 0.05;
  };
  const parse = s => {
    const c = s.match(/color\(srgb ([^)]+)\)/);
    if (c) { const p = c[1].split(/[ \/]+/).filter(Boolean).map(Number); return { r: p[0] * 255, g: p[1] * 255, b: p[2] * 255, a: p[3] ?? 1 }; }
    const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 };
  };
  const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const over = (top, under) => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1 });
  const white = { r: 255, g: 255, b: 255, a: 1 };

  // Background candidates behind an element: solid colour, or each stop of a gradient (worst case wins).
  const bgs = e => {
    const layers = [];
    for (let n = e; n; n = n.parentElement) {
      const c = getComputedStyle(n);
      const img = c.backgroundImage;
      if (img && img !== "none" && /gradient/.test(img)) {
        const stops = (img.match(/(?:rgba?|color)\([^)]+\)/g) || []).map(parse).filter(Boolean);
        if (stops.length) { const base = bgs(n.parentElement || n)[0] ?? white; return stops.map(s => s.a < 1 ? over(s, base) : s); }
      }
      const bg = parse(c.backgroundColor);
      if (bg && bg.a > 0) { layers.push(bg); if (bg.a >= 0.99) break; }
    }
    let base = white; for (const l of layers.reverse()) base = over(l, base);
    return [base];
  };

  // 1. Unresolved custom properties used by the theme without a fallback.
  const themeCss = [...document.querySelectorAll("style")].map(s => s.textContent).find(t => t.includes("Bliss Theme by")) || "";
  const used = new Set([...themeCss.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)].map(m => m[1]));
  const bodyStyle = getComputedStyle(document.body);
  const defined = new Set([...themeCss.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]));
  if (!themeCss) push("error", "theme", "-", "Bliss CSS not found in the document (theme not active?)");
  for (const v of used) if (!defined.has(v) && !bodyStyle.getPropertyValue(v).trim()) push("error", "var", v, "Obsidian variable used without fallback resolves empty");

  // 2-4. Per-element checks.
  const seen = new Set();
  for (const e of document.querySelectorAll("body *")) {
    if (e.closest("svg") && e.tagName.toLowerCase() !== "svg") continue;
    if (!visible(e) || e.matches(".nn-visually-hidden, .sr-only, .visually-hidden")) continue;
    const hasText = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
    const cs = getComputedStyle(e);
    const s = sig(e);

    if (hasText && !e.closest(".cm-content, .markdown-rendered, .markdown-source-view .cm-line")) {
      const fg = parse(cs.color), bgl = bgs(e);
      if (fg && bgl.length) {
        const worst = Math.min(...bgl.map(b => ratio(fg.a < 1 ? over(fg, b) : fg, b)));
        const big = parseFloat(cs.fontSize) >= 18.66 || (parseFloat(cs.fontSize) >= 14 && +cs.fontWeight >= 700);
        const need = big ? 3 : 4.5;
        if (worst < 3 && !seen.has("c" + s)) { seen.add("c" + s); push("error", "contrast", s, `ratio ${worst.toFixed(2)} (fg ${cs.color}) "${e.textContent.trim().slice(0, 24)}"`); }
        else if (worst < need && !seen.has("c" + s)) { seen.add("c" + s); push("warn", "contrast", s, `ratio ${worst.toFixed(2)} < ${need} (fg ${cs.color})`); }
      }
      if (cs.overflowX !== "visible" && cs.textOverflow !== "ellipsis" && cs.maskImage === "none" && e.scrollWidth > e.clientWidth + 2 && cs.whiteSpace === "nowrap" && !seen.has("k" + s)) {
        seen.add("k" + s); push("error", "clip", s, `text cut off (scrollWidth ${e.scrollWidth} > ${e.clientWidth}) without ellipsis`);
      }
    }

    if (/^(button|input|select)$/i.test(e.tagName) || e.matches(".clickable-icon, .checkbox-container, [role=button]")) {
      const r = e.getBoundingClientRect();
      if ((r.width < 16 || r.height < 16) && !e.matches("input[type=checkbox], input[type=radio], input[type=range]") && !seen.has("h" + s)) {
        seen.add("h" + s); push("warn", "target", s, `hit target ${Math.round(r.width)}x${Math.round(r.height)}px`);
      }
    }
  }
  return out;
}

// ---- Driver ----
const MODES = ["theme-dark", "theme-light"];
const ACCENTS = ["bp-accent-luna", "bp-accent-olive", "bp-accent-silver", "bp-accent-orange", "bp-accent-native"];
const SCENES = {
  none: null,
  "command-palette": "command-palette:open",
  "quick-switcher": "switcher:open",
};
const passes = [];
for (const m of MODES) for (const a of quick ? [ACCENTS[0]] : ACCENTS) passes.push({ mode: m, accent: a, scene: "none" });
for (const m of MODES) for (const s of Object.keys(SCENES)) if (s !== "none") passes.push({ mode: m, accent: ACCENTS[0], scene: s });
const dedup = passes;

const initial = await run(`(() => ({ cls: document.body.className, left: !app.workspace.leftSplit.collapsed, right: !app.workspace.rightSplit.collapsed }))()`);
await run(`(() => { app.workspace.leftSplit.expand(); app.workspace.rightSplit.expand(); })()`);

const findings = new Map();
for (const p of dedup) {
  await run(`(() => {
    const b = document.body;
    ${JSON.stringify(MODES)}.forEach(c => b.classList.remove(c)); ${JSON.stringify(ACCENTS)}.forEach(c => b.classList.remove(c));
    b.classList.add(${JSON.stringify(p.mode)}, ${JSON.stringify(p.accent)});
  })()`);
  const cmd = SCENES[p.scene];
  if (cmd) await run(`app.commands.executeCommandById(${JSON.stringify(cmd)})`);
  await new Promise(r => setTimeout(r, 450));
  const res = await run(`(${audit.toString()})()`);
  if (cmd) { await run(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))`); await new Promise(r => setTimeout(r, 200)); }
  const label = `${p.mode.replace("theme-", "")}/${p.accent.replace("bp-accent-", "")}/${p.scene}`;
  for (const f of res) {
    const k = `${f.level}|${f.check}|${f.where}|${f.msg.replace(/[\d.]+/g, "#")}`;
    if (!findings.has(k)) findings.set(k, { ...f, in: [] });
    findings.get(k).in.push(label);
  }
  console.log(`pass ${label}: ${res.length} finding(s)`);
}

await run(`(() => {
  const b = document.body; ${JSON.stringify(MODES)}.forEach(c => b.classList.remove(c)); ${JSON.stringify(ACCENTS)}.forEach(c => b.classList.remove(c));
  ${JSON.stringify(initial.cls)}.split(" ").filter(Boolean).forEach(c => b.classList.add(c));
  if (!b.classList.contains("theme-dark") && !b.classList.contains("theme-light")) b.classList.add(app.vault.getConfig("theme") === "obsidian" ? "theme-dark" : "theme-light");
  if (!${initial.left}) app.workspace.leftSplit.collapse(); if (!${initial.right}) app.workspace.rightSplit.collapse();
})()`);
ws.close();

console.log("");
const list = [...findings.values()].sort((a, b) => (a.level === b.level ? a.check.localeCompare(b.check) : a.level === "error" ? -1 : 1));
for (const f of list) console.log(`${f.level.toUpperCase().padEnd(5)} [${f.check}] ${f.where}: ${f.msg}  (${f.in.length}/${dedup.length} passes: ${f.in.slice(0, 3).join(", ")}${f.in.length > 3 ? ", ..." : ""})`);
const errs = list.filter(f => f.level === "error").length;
console.log(`\nlive: ${errs} error(s), ${list.length - errs} warning(s) across ${dedup.length} passes`);
process.exit(errs ? 1 : 0);
void fileURLToPath;
