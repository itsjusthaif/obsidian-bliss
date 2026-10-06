// Merges the current task branch into dev after the checks pass. Usage: npm run ship [-- --no-changelog]
// Steps: clean tree -> bring in dev -> npm test -> changelog check -> merge --no-ff into dev (in the folder where dev is checked out). Nothing is pushed or deleted.
import { execSync, spawnSync } from "node:child_process";

const git = a => execSync(`git ${a}`, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }).trim();
const fail = m => { console.error(`\nSHIP STOPPED: ${m}\n`); process.exit(1); };
const run = (cmd, args, env = {}) => spawnSync(cmd, args, { stdio: "inherit", shell: true, env: { ...process.env, ...env } }).status === 0;

const branch = git("rev-parse --abbrev-ref HEAD");
if (["main", "dev"].includes(branch)) fail(`run this from a task branch, not '${branch}'. Start one with: npm run task -- fix/<name>`);
// Uncommitted edits elsewhere (another agent or the owner) are left alone, but anything this branch touches must be committed.
const dirty = execSync("git status --porcelain --untracked-files=no", { encoding: "utf8" }).split("\n").filter(Boolean).map(l => l.slice(3).trim());
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

// dev can be checked out in another folder (the main one, when this is a --worktree task); merge there instead of switching.
const here = git("rev-parse --show-toplevel");
const devDir = execSync("git worktree list --porcelain", { encoding: "utf8" }).split(/\r?\n\r?\n/)
  .map(b => ({ dir: (b.match(/^worktree (.+)$/m) ?? [])[1], branch: (b.match(/^branch refs\/heads\/(.+)$/m) ?? [])[1] }))
  .find(w => w.branch === "dev")?.dir;
const inDevDir = devDir && devDir !== here;
const gitIn = (dir, a) => execSync(`git -C "${dir}" ${a}`, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }).trim();
if (inDevDir) {
  const devDirty = gitIn(devDir, "status --porcelain --untracked-files=no").split("\n").filter(Boolean).map(l => l.slice(3).trim());
  const devClash = devDirty.filter(f => changed.includes(f));
  if (devClash.length) fail(`dev (${devDir}) has uncommitted edits to files this branch changes: ${devClash.join(", ")}. Commit or stash them there first.`);
} else {
  git("switch dev");
}
const merged = spawnSync("git", [...(inDevDir ? ["-C", `"${devDir}"`] : []), "merge", "--no-ff", branch, "-m", `"Merge ${branch}"`], { stdio: "inherit", shell: true, env: { ...process.env, BLISS_SHIP: "1" } }).status === 0;
if (!merged) fail(`merge into dev failed; dev is untouched or mid-merge, check 'git status'${inDevDir ? ` in ${devDir}` : ""}.`);
console.log(`\nshipped ${branch} into dev (${inDevDir ? gitIn(devDir, "rev-parse --short HEAD") : git("rev-parse --short HEAD")}).\nBefore a release, load the theme in Obsidian and check it. The branch is kept; remove it with: git branch -d ${branch}`);
