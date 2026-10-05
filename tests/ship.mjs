// Merges the current task branch into dev after the checks pass. Usage: npm run ship [-- --no-changelog]
// Steps: clean tree -> bring in dev -> npm test -> changelog check -> merge --no-ff into dev. Nothing is pushed or deleted.
import { execSync, spawnSync } from "node:child_process";

const git = a => execSync(`git ${a}`, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }).trim();
const fail = m => { console.error(`\nSHIP STOPPED: ${m}\n`); process.exit(1); };
const run = (cmd, args, env = {}) => spawnSync(cmd, args, { stdio: "inherit", shell: true, env: { ...process.env, ...env } }).status === 0;

const branch = git("rev-parse --abbrev-ref HEAD");
if (["main", "dev"].includes(branch)) fail(`run this from a task branch, not '${branch}'. Start one with: npm run task -- fix/<name>`);
// Uncommitted edits elsewhere (another agent or the owner) are left alone, but anything this branch touches must be committed.
const dirty = git("status --porcelain --untracked-files=no").split("\n").filter(Boolean).map(l => l.slice(3).trim());
if (dirty.includes("theme.css")) fail("theme.css has uncommitted edits. Commit them on their own task branch (or ask the owner) before shipping.");
const touched = git("diff --name-only dev...HEAD").split("\n").filter(Boolean);
const clash = dirty.filter(f => touched.includes(f));
if (clash.length) fail(`uncommitted edits to files this branch changes: ${clash.join(", ")}. Commit them first.`);
if (dirty.length) console.log(`leaving unrelated uncommitted edits alone: ${dirty.join(", ")}`);

console.log(`bringing dev into ${branch}`);
if (!run("git", ["merge", "dev", "--no-edit"])) fail("merging dev hit conflicts. Resolve them on this branch, commit, then ship again.");

console.log("running checks");
if (!run("npm", ["test"])) fail("npm test failed.");

const changed = git("diff --name-only dev...HEAD").split("\n").filter(Boolean);
if (!changed.length) fail("nothing to ship: this branch has no changes against dev.");
if (changed.includes("theme.css") && !changed.includes("CHANGELOG.md") && !process.argv.includes("--no-changelog")) {
  fail("theme.css changed but CHANGELOG.md has no entry under [Unreleased]. Add one (or pass --no-changelog for a non-visible change).");
}

git("switch dev");
if (!run("git", ["merge", "--no-ff", branch, "-m", `"Merge ${branch}"`], { BLISS_SHIP: "1" })) fail(`merge into dev failed; dev is untouched or mid-merge, check 'git status'.`);
console.log(`\nshipped ${branch} into dev (${git("rev-parse --short HEAD")}).\nBefore a release, load the theme in Obsidian and check it. The branch is kept; remove it with: git branch -d ${branch}`);
