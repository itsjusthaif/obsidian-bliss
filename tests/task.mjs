// Starts a task branch from dev. Usage: npm run task -- fix/<name> [--worktree]
// Prefixes: feature/ fix/ chore/ docs/. --worktree makes a separate folder beside the theme so parallel agents do not share a working tree.
import { execSync } from "node:child_process";

const [name, ...flags] = process.argv.slice(2);
const git = a => execSync(`git ${a}`, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }).trim();
if (!name || !/^(feature|fix|chore|docs)\/[a-z0-9][a-z0-9-]*$/.test(name)) {
  console.error("usage: npm run task -- <feature|fix|chore|docs>/<kebab-name> [--worktree]");
  process.exit(1);
}
const exists = git(`branch --list ${name}`) !== "";
if (flags.includes("--worktree")) {
  const dir = `../Bliss-${name.replace("/", "-")}`;
  git(`worktree add ${exists ? "" : `-b ${name}`} ${dir} ${exists ? name : "dev"}`);
  console.log(`worktree ready: ${dir} on ${name}\nCopy its theme.css into a themes folder to test in Obsidian, then run 'npm run ship' from that folder.`);
} else {
  git(exists ? `switch ${name}` : `switch -c ${name} dev`);
  console.log(`on ${name}${exists ? "" : " (from dev)"}`);
  if (git("status --porcelain")) console.log("note: uncommitted changes were carried over; commit only the files this task owns.");
}
