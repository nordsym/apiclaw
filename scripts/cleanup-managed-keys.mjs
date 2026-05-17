#!/usr/bin/env node
/**
 * Security cleanup of providerDirectCall.encryptedMasterKey rows.
 *
 * Reads the audit report produced by audit-managed-keys.mjs and acts
 * per row:
 *
 *   PLAINTEXT_KEY  -> encrypt with src/crypto.ts (12-byte IV format)
 *                     and patch the row in place
 *   UNKNOWN (real) -> same; flagged by additional heuristic since the
 *                     audit's plaintext regex set is conservative
 *   PLACEHOLDER    -> set routing status="draft" so /v1/call won't try
 *                     to route through it; preserves history
 *   "managed-by-apiclaw" sentinel -> leave (no secret leak; key lives
 *                                    elsewhere, likely in Convex env)
 *   ENCRYPTED_12BYTE -> leave
 *
 * Run from apiclaw repo root after `npm run build` and after a fresh
 * audit:
 *   node scripts/audit-managed-keys.mjs      # produces report
 *   node scripts/cleanup-managed-keys.mjs    # acts on the report
 */
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { encryptKey } from "../dist/crypto.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const reportPath = join(__dirname, "audit-managed-keys.report.json");

const envPath = join(repoRoot, ".env.local");
const envText = readFileSync(envPath, "utf-8");
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (!m) continue;
  if (!process.env[m[1]]) process.env[m[1]] = m[2];
}

function convexRun(fnPath, args) {
  const cmd = `npx convex run ${fnPath} '${JSON.stringify(args)}'`;
  return execSync(cmd, {
    cwd: repoRoot,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

const report = JSON.parse(readFileSync(reportPath, "utf-8"));

// Additional plaintext detection for rows the audit's conservative regex
// missed. Anything that's not "managed-by-apiclaw", not 3-part hex, and
// not obviously empty/placeholder is treated as a real plaintext key.
function looksLikePlaintextSecret(key) {
  if (typeof key !== "string" || key.length === 0) return false;
  if (key === "managed-by-apiclaw") return false;
  if (/^YOUR_/i.test(key)) return false;
  if (/^_+$/.test(key)) return false;
  if (/^:+$/.test(key)) return false;
  const parts = key.split(":");
  if (parts.length === 3 && parts.every((p) => /^[0-9a-f]+$/i.test(p))) {
    return false; // properly encrypted
  }
  return true; // anything else with content is a candidate
}

let encrypted = 0;
let marked = 0;
let skipped = 0;
let failed = 0;
const actions = [];

for (const row of report.rows) {
  const { rowId, providerName, _category, encryptedMasterKey } = row;

  if (_category === "ENCRYPTED_12BYTE") {
    skipped++;
    actions.push({ rowId, providerName, action: "skip (already canonical)" });
    continue;
  }

  // Skip the seed sentinel — it's intentional and contains no secret.
  if (encryptedMasterKey === "managed-by-apiclaw") {
    skipped++;
    actions.push({ rowId, providerName, action: "skip (managed-by-apiclaw sentinel)" });
    continue;
  }

  if (_category === "PLACEHOLDER") {
    try {
      convexRun("missionRunner:setRoutingStatus", { rowId, status: "draft" });
      marked++;
      actions.push({ rowId, providerName, action: "marked status=draft" });
    } catch (e) {
      failed++;
      actions.push({ rowId, providerName, action: `FAIL status: ${e.message?.slice(0, 80)}` });
    }
    continue;
  }

  // PLAINTEXT_KEY or UNKNOWN-that-looks-like-a-secret -> encrypt
  if (_category === "PLAINTEXT_KEY" || looksLikePlaintextSecret(encryptedMasterKey)) {
    try {
      const fresh = encryptKey(encryptedMasterKey);
      convexRun("missionRunner:reencryptRoutingKey", {
        rowId,
        newEncryptedMasterKey: fresh,
      });
      encrypted++;
      actions.push({ rowId, providerName, action: "encrypted in place" });
    } catch (e) {
      failed++;
      actions.push({ rowId, providerName, action: `FAIL encrypt: ${e.message?.slice(0, 80)}` });
    }
    continue;
  }

  skipped++;
  actions.push({ rowId, providerName, action: "skip (no rule matched)" });
}

console.log("=".repeat(80));
console.log("CLEANUP ACTIONS");
console.log("=".repeat(80));
for (const a of actions) {
  console.log(`  ${a.providerName.padEnd(22)} ${a.action}`);
}
console.log("=".repeat(80));
console.log(`Encrypted: ${encrypted}`);
console.log(`Marked draft: ${marked}`);
console.log(`Skipped: ${skipped}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${report.rows.length}`);
