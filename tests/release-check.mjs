// Release hygiene: manifest, changelog, tag and community-theme submission files must agree.
// Usage: node tests/release-check.mjs
import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";

let errors = 0;
const fail = m => { errors++; console.error("FAIL " + m); };
const ok = m => console.log("ok   " + m);

const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
for (const k of ["name", "version", "minAppVersion", "author", "authorUrl"]) manifest[k] ? ok(`manifest.${k} = ${manifest[k]}`) : fail(`manifest.${k} missing`);
if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) fail("manifest.version is not x.y.z");

for (const f of ["theme.css", "LICENSE", "README.md"]) existsSync(f) ? ok(f) : fail(`${f} missing`);
existsSync("screenshot.png") ? ok("screenshot.png") : fail("screenshot.png missing (required by the community theme submission)");

if (existsSync("package.json")) {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  pkg.version === manifest.version ? ok("package.json version matches manifest") : fail(`package.json ${pkg.version} != manifest ${manifest.version}`);
}

const log = existsSync("CHANGELOG.md") ? readFileSync("CHANGELOG.md", "utf8") : "";
log.includes(`## [${manifest.version}]`) ? ok(`CHANGELOG has [${manifest.version}]`) : fail(`CHANGELOG.md has no "## [${manifest.version}]" entry`);

try {
  const tags = execSync("git tag --list", { encoding: "utf8" }).split(/\s+/);
  tags.includes(manifest.version) ? ok(`tag ${manifest.version} exists`) : console.log(`note tag ${manifest.version} not created yet (Obsidian needs the release tag to equal the manifest version, with no 'v' prefix)`);
  const dirty = execSync("git status --porcelain", { encoding: "utf8" }).trim();
  if (dirty) console.log("note working tree has uncommitted changes");
} catch { /* not a git repo */ }

console.log(`\nrelease-check: ${errors} problem(s)`);
process.exit(errors ? 1 : 0);
