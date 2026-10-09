// Visual regression: screenshots key views per mode and accent and compares them with local baselines.
// Usage: node tests/visual.mjs [--port 9222] [--update] [--threshold 0.003] [--quick]
// Needs Obsidian started with --remote-debugging-port=9222 and the "Bliss Theme Showcase" note in the vault.
// Baselines live in tests/snapshots (git-ignored: they depend on your window size and vault); first run creates them.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const port = opt("port", "9222"), threshold = +opt("threshold", "0.003"), update = args.includes("--update"), quick = args.includes("--quick");
const dir = "tests/snapshots", failDir = join(dir, "_failed");
mkdirSync(failDir, { recursive: true });

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

// Runs inside Obsidian: fraction of pixels whose channels differ by more than 8.
const diffInPage = async (a, b) => {
  const load = async s => {
    const bin = atob(s), u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    const bmp = await createImageBitmap(new Blob([u8], { type: "image/png" }));
    const c = new OffscreenCanvas(bmp.width, bmp.height), x = c.getContext("2d");
    x.drawImage(bmp, 0, 0);
    return { w: bmp.width, h: bmp.height, d: x.getImageData(0, 0, bmp.width, bmp.height).data };
  };
  const [p, q] = await Promise.all([load(a), load(b)]);
  if (p.w !== q.w || p.h !== q.h) return { ratio: 1, note: `size ${p.w}x${p.h} vs ${q.w}x${q.h}` };
  let bad = 0;
  for (let i = 0; i < p.d.length; i += 4)
    if (Math.abs(p.d[i] - q.d[i]) > 8 || Math.abs(p.d[i + 1] - q.d[i + 1]) > 8 || Math.abs(p.d[i + 2] - q.d[i + 2]) > 8) bad++;
  return { ratio: bad / (p.w * p.h) };
};

const MODES = ["theme-dark", "theme-light"];
const ACCENTS = ["luna", "olive", "silver", "orange", "embedded", "whistler-chartreuse", "whistler-lagoon", "native"];
const setBody = (mode, accent) => run(`(() => {
  const b = document.body;
  ${JSON.stringify(MODES)}.forEach(c => b.classList.remove(c));
  [...b.classList].filter(c => c.startsWith("bp-accent-")).forEach(c => b.classList.remove(c));
  b.classList.add(${JSON.stringify(mode)}, "bp-accent-${accent}");
})()`);

const initial = await run(`document.body.className`);
const hasNote = await run(`(async () => {
  const f = app.vault.getMarkdownFiles().find(f => f.basename === "Bliss Theme Showcase"); if (!f) return false;
  const l = app.workspace.getLeaf(false);
  await l.setViewState({ type: "markdown", state: { file: f.path, mode: "preview", source: false }, active: true });
  app.workspace.leftSplit.expand(); app.workspace.rightSplit.expand(); return true;
})()`);
if (!hasNote) console.warn("Showcase note not found: only modal scenes are captured");

const scenes = [];
for (const m of MODES) for (const a of quick ? ["luna"] : ACCENTS) if (hasNote) scenes.push({ name: `note-${m.slice(6)}-${a}`, mode: m, accent: a });
for (const m of MODES) for (const [n, cmd] of [["palette", "command-palette:open"], ["switcher", "switcher:open"]]) scenes.push({ name: `${n}-${m.slice(6)}`, mode: m, accent: "luna", cmd });

let failed = 0, created = 0;
for (const s of scenes) {
  await setBody(s.mode, s.accent);
  if (s.cmd) await run(`app.commands.executeCommandById(${JSON.stringify(s.cmd)})`);
  await wait(600);
  const shot = (await send("Page.captureScreenshot", { format: "png" })).result.data;
  if (s.cmd) { await run(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))`); await wait(200); }

  const file = join(dir, s.name + ".png");
  if (update || !existsSync(file)) { writeFileSync(file, Buffer.from(shot, "base64")); created++; console.log(`base ${s.name}`); continue; }
  const { ratio, note } = await run(`(${diffInPage.toString()})(${JSON.stringify(readFileSync(file).toString("base64"))}, ${JSON.stringify(shot)})`);
  const bad = ratio > threshold;
  if (bad) { failed++; writeFileSync(join(failDir, s.name + ".png"), Buffer.from(shot, "base64")); }
  console.log(`${bad ? "FAIL" : "ok  "} ${s.name}  ${(ratio * 100).toFixed(2)}% differ${note ? " (" + note + ")" : ""}`);
}

await run(`document.body.className = ${JSON.stringify(initial)}`);
ws.close();
console.log(`\nvisual: ${failed} failed, ${created} baseline(s) written, ${scenes.length} scene(s). Failed captures are in ${failDir}`);
process.exit(failed ? 1 : 0);
