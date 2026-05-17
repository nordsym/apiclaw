#!/usr/bin/env node
/**
 * Security audit of providerDirectCall.encryptedMasterKey rows.
 *
 * Categorises every row into:
 *   - ENCRYPTED_12BYTE  - canonical AES-GCM-IV12 ciphertext, no action needed
 *   - ENCRYPTED_16BYTE  - legacy AES-GCM-IV16, needs format migration
 *   - PLACEHOLDER       - "YOUR_XYZ", ":", empty, or other obviously-fake
 *   - PLAINTEXT_KEY     - looks like a real upstream-provider secret stored raw
 *   - UNKNOWN           - unrecognised shape, manual review needed
 *
 * Reads via `npx convex run` (admin auth) so internal queries are reachable.
 * Writes a JSON report to scripts/audit-managed-keys.report.json and prints
 * a human summary. The JSON file contains plaintext secrets — gitignored.
 *
 * Run from apiclaw repo root:
 *   node scripts/audit-managed-keys.mjs
 */
import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");

function convexRun(fnPath, args = {}) {
  const cmd = `npx convex run ${fnPath} '${JSON.stringify(args)}'`;
  const out = execSync(cmd, {
    cwd: repoRoot,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return JSON.parse(out);
}

const HEX = /^[0-9a-f]+$/i;
function categorise(key) {
  if (typeof key !== "string" || key.length === 0) {
    return { category: "PLACEHOLDER", reason: "empty" };
  }
  if (/^YOUR_/i.test(key)) return { category: "PLACEHOLDER", reason: "YOUR_* placeholder" };
  if (/^_+$/.test(key)) return { category: "PLACEHOLDER", reason: "underscores-only" };
  if (/^:+$/.test(key) || key === ":") return { category: "PLACEHOLDER", reason: "colon-only" };

  const parts = key.split(":");
  if (parts.length === 3 && parts.every((p) => p.length > 0 && HEX.test(p))) {
    const ivBytes = parts[0].length / 2;
    if (ivBytes === 12) return { category: "ENCRYPTED_12BYTE", reason: "canonical" };
    return { category: "ENCRYPTED_16BYTE", reason: `legacy IV ${ivBytes}B` };
  }

  const plaintextSignatures = [
    { name: "Resend", re: /^re_[A-Za-z0-9_]+/ },
    { name: "Stripe", re: /^(sk|pk|rk)_(live|test)_[A-Za-z0-9]+/ },
    { name: "OpenAI", re: /^sk-[A-Za-z0-9_-]{20,}/ },
    { name: "Anthropic", re: /^sk-ant-[A-Za-z0-9_-]+/ },
    { name: "OpenRouter", re: /^sk-or-v1-[A-Za-z0-9_-]+/ },
    { name: "GitHub", re: /^(ghp|gho|ghu|ghr|ghs)_[A-Za-z0-9]{36,}/ },
    { name: "Slack", re: /^xox[abprs]-[A-Za-z0-9-]+/ },
    { name: "AWS", re: /^AKIA[A-Z0-9]{16}$/ },
    { name: "Brave", re: /^BSA[A-Za-z0-9_-]{20,}/ },
    { name: "ElevenLabs", re: /^sk_[a-f0-9]{40,}/ },
    { name: "Groq", re: /^gsk_[A-Za-z0-9]+/ },
    { name: "Replicate", re: /^r8_[A-Za-z0-9]+/ },
    { name: "DeepInfra", re: /^[A-Za-z0-9]{40,}$/ },
  ];
  for (const sig of plaintextSignatures) {
    if (sig.re.test(key)) {
      return { category: "PLAINTEXT_KEY", reason: `${sig.name} format` };
    }
  }

  return { category: "UNKNOWN", reason: `shape: ${parts.length} colon-parts, length ${key.length}` };
}

console.log("Pulling providerDirectCall rows + provider names ...");
const rows = convexRun("missionRunner:auditEncryptedRouting");
console.log(`Got ${rows.length} routing row(s).\n`);

const buckets = {
  ENCRYPTED_12BYTE: [],
  ENCRYPTED_16BYTE: [],
  PLACEHOLDER: [],
  PLAINTEXT_KEY: [],
  UNKNOWN: [],
};

for (const row of rows) {
  const { category, reason } = categorise(row.encryptedMasterKey);
  buckets[category].push({ ...row, _category: category, _reason: reason });
}

function fmtRow(r) {
  const sample = String(r.encryptedMasterKey).slice(0, 50);
  const more = r.encryptedMasterKey.length > 50 ? "..." : "";
  return `    [${(r.routingStatus ?? "?").padEnd(8)}] ${r.providerName.padEnd(22)} | ${r._reason.padEnd(28)} | "${sample}${more}"`;
}

console.log("=".repeat(90));
console.log("SECURITY AUDIT - providerDirectCall.encryptedMasterKey");
console.log("=".repeat(90));
for (const [cat, list] of Object.entries(buckets)) {
  console.log(`\n${cat} (${list.length})`);
  for (const r of list) console.log(fmtRow(r));
}
console.log("\n" + "=".repeat(90));
console.log("SUMMARY:");
for (const [cat, list] of Object.entries(buckets)) {
  console.log(`  ${cat.padEnd(22)} ${list.length}`);
}
console.log("=".repeat(90));

const reportPath = join(__dirname, "audit-managed-keys.report.json");
writeFileSync(
  reportPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      total: rows.length,
      byCategory: Object.fromEntries(
        Object.entries(buckets).map(([k, v]) => [k, v.length]),
      ),
      rows: Object.values(buckets).flat(),
    },
    null,
    2,
  ),
);
console.log(`\nFull report (with key values) written to ${reportPath}`);
console.log("That file contains plaintext secrets — gitignored.");
