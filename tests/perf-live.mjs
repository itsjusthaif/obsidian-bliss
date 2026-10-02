// Runtime cost of Bliss: style recalculation and scroll frame times with the theme on vs off.
// Usage: node tests/perf-live.mjs [--port 9222] [--runs 5] [--max-ratio 1.5]
// Needs Obsidian started with --remote-debugging-port=9222. "Off" disables the theme's <style> element temporarily; nothing is saved.
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const port = opt("port", "9222"), runs = +opt("runs", "5"), maxRatio = +opt("max-ratio", "1.5");

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
const metrics = async () => Object.fromEntries((await send("Performance.getMetrics")).result.metrics.map(m => [m.name, m.value]));
await send("Performance.enable");

const setTheme = on => run(`(() => {
  const s = [...document.querySelectorAll("style")].find(s => s.textContent.includes("Bliss Theme by"));
  if (!s) return false; s.disabled = ${!on}; return true;
})()`);
if (!(await setTheme(true))) { console.error("Bliss CSS not found in the document (theme not active?)"); process.exit(2); }

// Toggling the theme class forces a full style recalculation of the document.
const recalc = async () => {
  const before = await metrics();
  await run(`(async () => {
    for (let i = 0; i < ${runs}; i++) {
      document.body.classList.toggle("theme-dark"); document.body.classList.toggle("theme-light");
      void document.body.offsetHeight;
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    }
    for (let i = 0; i < ${runs} % 2; i++) { document.body.classList.toggle("theme-dark"); document.body.classList.toggle("theme-light"); }
  })()`);
  const after = await metrics();
  const d = k => (after[k] - before[k]) * 1000 / runs;
  return { styleMs: d("RecalcStyleDuration"), layoutMs: d("LayoutDuration"), styleCount: (after.RecalcStyleCount - before.RecalcStyleCount) / runs };
};

// Scroll the first scroller found among the given selectors, one frame at a time.
const scroll = selectors => run(`(async () => {
  const el = ${JSON.stringify(selectors)}.map(s => [...document.querySelectorAll(s)].find(e => e.scrollHeight > e.clientHeight + 200 && e.getBoundingClientRect().width > 0)).find(Boolean);
  if (!el) return null;
  const start = el.scrollTop, step = Math.max(8, (el.scrollHeight - el.clientHeight) / 120), gaps = [];
  let last = performance.now();
  for (let i = 0; i < 90; i++) {
    el.scrollTop = start + (i % 2 ? -1 : 1) * step * (i % 45);
    await new Promise(r => requestAnimationFrame(r));
    const n = performance.now(); gaps.push(n - last); last = n;
  }
  el.scrollTop = start;
  gaps.sort((a, b) => a - b);
  return { avg: gaps.reduce((a, b) => a + b, 0) / gaps.length, p95: gaps[Math.floor(gaps.length * 0.95)], max: gaps[gaps.length - 1] };
})()`);

const SCROLLERS = {
  "note": [".workspace-leaf.mod-active .markdown-preview-view", ".workspace-leaf.mod-active .cm-scroller"],
  "navigator list": [".nn-list-pane-scroller"],
  "file explorer": [".nav-files-container"],
};

const results = {};
for (const on of [false, true]) {
  await setTheme(on);
  await new Promise(r => setTimeout(r, 400));
  const key = on ? "bliss" : "baseline";
  results[key] = { recalc: await recalc() };
  for (const [name, sel] of Object.entries(SCROLLERS)) results[key][name] = await scroll(sel);
}
await setTheme(true);
ws.close();

const f = n => n.toFixed(2).padStart(7);
const ratio = (a, b) => (b > 0 ? a / b : 1);
let fails = 0;
console.log("metric                     baseline    bliss   ratio");
const row = (label, a, b, check) => {
  const r = ratio(b, a), bad = check && r > maxRatio && b - a > 2;
  if (bad) fails++;
  console.log(`${bad ? "FAIL" : "ok  "} ${label.padEnd(22)} ${f(a)} ${f(b)}   ${r.toFixed(2)}x`);
};
row("style recalc (ms)", results.baseline.recalc.styleMs, results.bliss.recalc.styleMs, true);
row("layout (ms)", results.baseline.recalc.layoutMs, results.bliss.recalc.layoutMs, true);
for (const name of Object.keys(SCROLLERS)) {
  const a = results.baseline[name], b = results.bliss[name];
  if (!a || !b) { console.log(`skip ${name} (no long scroller visible)`); continue; }
  row(`${name} avg frame (ms)`, a.avg, b.avg, true);
  row(`${name} p95 frame (ms)`, a.p95, b.p95, false);
}
console.log(`\nperf-live: ${fails} metric(s) over ${maxRatio}x baseline`);
process.exit(fails ? 1 : 0);
