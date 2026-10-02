// Dark-mode parity audit: finds large surfaces that are still light while theme-dark is active.
// Usage: node tests/parity.mjs [--port 9222] [--min-area 1500] [--lum 0.55] [--mode light]
// --mode light is a sanity check: the scanner must then report many light surfaces.
// Scenes: workspace, command palette, quick switcher, settings (each tab), context menu. Nothing is saved.
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const mode = opt("mode", "dark"), port = opt("port", "9222"), minArea = +opt("min-area", "1500"), maxLum = +opt("lum", "0.55");

const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const t = targets.find(x => x.type === "page" && x.url.startsWith("app://obsidian.md"));
if (!t) { console.error("No Obsidian page on debug port " + port); process.exit(2); }
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = m => { const d = JSON.parse(m.data); pending.get(d.id)?.(d); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const run = async expr => {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails.exception?.description ?? r.result.exceptionDetails));
  return r.result?.result?.value;
};
const wait = ms => new Promise(r => setTimeout(r, ms));

// Runs inside Obsidian.
function scan(minArea, maxLum) {
  const parse = s => {
    const c = s.match(/color\(srgb ([^)]+)\)/);
    if (c) { const p = c[1].split(/[ \/]+/).filter(Boolean).map(Number); return { r: p[0] * 255, g: p[1] * 255, b: p[2] * 255, a: p[3] ?? 1 }; }
    const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 };
  };
  const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const sig = e => {
    const cls = [...e.classList].filter(c => !/^(is-|mod-active|has-focus)/.test(c)).slice(0, 3).join(".");
    const p = e.parentElement;
    return e.tagName.toLowerCase() + (cls ? "." + cls : "") + (p ? " < " + p.tagName.toLowerCase() + (p.classList[0] ? "." + p.classList[0] : "") : "");
  };
  const out = new Map();
  for (const e of document.querySelectorAll("body *")) {
    if (e.closest("svg") || e.closest(".cm-content, .markdown-rendered")) continue;
    const r = e.getBoundingClientRect();
    if (r.width * r.height < minArea || r.width < 1 || r.height < 1) continue;
    const cs = getComputedStyle(e);
    if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity < 0.2) continue;
    const img = cs.backgroundImage, bg = parse(cs.backgroundColor);
    let l = null;
    if (img && /gradient/.test(img)) {
      const stops = (img.match(/(?:rgba?|color)\([^)]+\)/g) || []).map(parse).filter(s => s && s.a > 0.6);
      if (stops.length) l = stops.reduce((a, s) => a + lum(s), 0) / stops.length;
    } else if (bg && bg.a > 0.6) l = lum(bg);
    if (l === null || l <= maxLum) continue;
    const k = sig(e);
    const prev = out.get(k);
    out.set(k, { sel: k, lum: l, area: Math.round(r.width * r.height), bg: img !== "none" ? "gradient" : cs.backgroundColor, n: (prev?.n ?? 0) + 1 });
  }
  return [...out.values()];
}

const initial = await run(`(() => ({ cls: document.body.className, left: !app.workspace.leftSplit.collapsed, right: !app.workspace.rightSplit.collapsed }))()`);
await run(`(() => { const b = document.body; b.classList.remove("theme-light", "theme-dark"); b.classList.add(${JSON.stringify("theme-" + mode)}); app.workspace.leftSplit.expand(); app.workspace.rightSplit.expand(); })()`);

const found = new Map();
const record = (scene, items) => {
  for (const it of items) {
    const f = found.get(it.sel) ?? { ...it, scenes: new Set(), n: 0 };
    f.scenes.add(scene); f.lum = Math.max(f.lum, it.lum); found.set(it.sel, f);
  }
  console.log(`scene ${scene}: ${items.length} light surface(s)`);
};
const capture = async scene => { await wait(500); record(scene, await run(`(${scan.toString()})(${minArea}, ${maxLum})`)); };
const close = async () => { await run(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))`); await wait(250); };

await capture("workspace");
for (const [name, cmd] of [["palette", "command-palette:open"], ["switcher", "switcher:open"]]) {
  await run(`app.commands.executeCommandById(${JSON.stringify(cmd)})`); await capture(name); await close();
}

await run(`app.setting.open()`); await wait(600);
const tabs = await run(`app.setting.settingTabs.map(t => t.id).concat(app.setting.pluginTabs.map(t => t.id))`);
for (const tab of tabs) {
  await run(`app.setting.openTabById(${JSON.stringify(tab)}); 0`);
  await capture(`settings:${tab}`);
}
await run(`app.setting.close()`); await wait(250);

await run(`(() => { const el = document.querySelector(".nav-file-title, .tree-item-self"); if (el) el.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 200, clientY: 200 })); })()`);
await capture("context-menu"); await close();

await run(`(() => {
  document.body.className = ${JSON.stringify(initial.cls)};
  if (!${initial.left}) app.workspace.leftSplit.collapse(); if (!${initial.right}) app.workspace.rightSplit.collapse();
})()`);
ws.close();

const list = [...found.values()].sort((a, b) => b.lum - a.lum);
console.log("");
for (const f of list) console.log(`lum ${f.lum.toFixed(2)}  ${f.sel}  bg ${f.bg}  ${f.area}px2  [${[...f.scenes].slice(0, 3).join(", ")}${f.scenes.size > 3 ? ", +" + (f.scenes.size - 3) : ""}]`);
console.log(`\nparity: ${list.length} light surface(s) in dark mode`);
process.exit(list.length ? 1 : 0);
