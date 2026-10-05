// Git hook guard. Usage (from .githooks): node tests/guard.mjs pre-commit | pre-merge-commit
// Blocks direct commits on protected branches and large unexplained deletions from theme.css.
import { execSync, spawnSync } from "node:child_process";

const git = a => execSync(`git ${a}`, { encoding: "utf8" }).trim();
const fail = m => { console.error(`\nBLOCKED: ${m}\n`); process.exit(1); };
const PROTECTED = ["main", "dev"];
const mode = process.argv[2];
const branch = git("rev-parse --abbrev-ref HEAD");

if (PROTECTED.includes(branch) && !process.env.BLISS_SHIP) {
  fail(`commits and merges on '${branch}' are not allowed directly.\nStart a task branch:  npm run task -- fix/<name>   (also feature/, chore/, docs/)\nWhen it is finished and tested:  npm run ship`);
}

if (mode === "pre-commit") {
  const staged = git("diff --cached --name-only").split("\n");
  if (staged.includes("theme.css")) {
    const [added, removed] = git("diff --cached --numstat -- theme.css").split("\t").map(Number);
    if (removed > 40 && removed > added + 20 && !process.env.BLISS_ALLOW_DELETE) {
      fail(`this commit removes ${removed} lines from theme.css and adds only ${added}.\nIf that is intended, repeat with BLISS_ALLOW_DELETE=1. Otherwise your copy of the file is probably stale.`);
    }
    const r = spawnSync("npm", ["test"], { stdio: "inherit", shell: true });
    if (r.status !== 0) fail("npm test failed; fix it before committing theme.css.");
  }
}
