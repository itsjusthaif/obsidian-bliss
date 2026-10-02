// Concatenates src/*.css (sorted by filename) into theme.css.
// Usage: node build.mjs [--check]   (--check fails if theme.css is out of date)
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const files = readdirSync("src").filter(f => f.endsWith(".css")).sort();
const out = files.map(f => readFileSync(`src/${f}`, "utf8")).join("");

if (process.argv.includes("--check")) {
  if (readFileSync("theme.css", "utf8") !== out) { console.error("theme.css is stale: run `node build.mjs`"); process.exit(1); }
  console.log(`theme.css up to date (${files.length} parts)`);
} else {
  writeFileSync("theme.css", out);
  console.log(`built theme.css from ${files.length} parts, ${out.split("\n").length - 1} lines`);
}
