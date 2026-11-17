import { execFileSync } from "node:child_process";
import { ESLint } from "eslint";

const git = (...args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
const base = process.env.LINT_BASE || "origin/main";
const diff = git("diff", "--no-ext-diff", "--unified=0", "--no-color", base, "--");
const changed = new Map();
let path;
for (const line of diff.split("\n")) {
  if (line.startsWith("+++ b/")) {
    path = line.slice(6);
    if (/\.(ts|tsx|js|mjs|cjs)$/.test(path)) changed.set(path, []);
  } else if (path && changed.has(path)) {
    const hunk = /^@@ .* \+(\d+)(?:,(\d+))? @@/.exec(line);
    if (hunk) changed.get(path).push([Number(hunk[1]), Number(hunk[1]) + Number(hunk[2] ?? 1) - 1]);
  }
}
for (const file of git("ls-files", "--others", "--exclude-standard", "-z").split("\0")) {
  if (/\.(ts|tsx|js|mjs|cjs)$/.test(file)) changed.set(file, [[1, Infinity]]);
}
const eslint = new ESLint();
let errors = 0;
let legacy = 0;
for (const [file, ranges] of changed) {
  if (await eslint.isPathIgnored(file)) continue;
  for (const result of await eslint.lintFiles(file)) {
    for (const message of result.messages) {
      const touchesChange = message.fatal || !message.line || ranges.some(([first, last]) =>
        message.line <= last && (message.endLine ?? message.line) >= first);
      if (touchesChange) {
        console.error(`${file}:${message.line ?? 1}:${message.column ?? 1} ${message.ruleId ?? "parse"} ${message.message}`);
        errors++;
      } else legacy++;
    }
  }
}
console.log(`ESLint: checked ${changed.size} changed/new files; ${errors} errors on changed lines; ${legacy} existing findings outside changed lines.`);
process.exitCode = errors ? 1 : 0;
