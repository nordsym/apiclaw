#!/usr/bin/env node
/**
 * One-shot migration: re-encrypt every providerDirectCall.encryptedMasterKey
 * row from the legacy 16-byte-IV format to the AES-GCM-standard 12-byte-IV
 * format so the on-Convex execute primitive (Web Crypto) can decrypt them.
 *
 * Plaintext master keys never leave this process. Decrypted in-memory with
 * Node crypto (which accepts both 12- and 16-byte IVs), re-encrypted with
 * the updated src/crypto.ts encryptKey (12-byte IV), patched per row.
 *
 * Uses `npx convex run` so internal functions are reachable via the
 * developer's existing Convex CLI admin auth without juggling deploy keys.
 *
 * Run from the apiclaw repo root after `npm run build`:
 *   node scripts/migrate-iv-format.mjs
 */
import { execSync } from "child_process";
import { decryptKey, encryptKey } from "../dist/crypto.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");
const envText = readFileSync(envPath, "utf-8");
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (!m) continue;
  if (!process.env[m[1]]) process.env[m[1]] = m[2];
}

function convexRun(fnPath, args) {
  const cmd = `npx convex run ${fnPath} '${JSON.stringify(args)}'`;
  const out = execSync(cmd, {
    cwd: join(__dirname, ".."),
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return JSON.parse(out);
}

const rows = convexRun("missionRunner:listEncryptedRoutingForMigration", {});
console.log(`Found ${rows.length} providerDirectCall row(s).`);

let migrated = 0;
let skipped = 0;
// Only consider rows whose encryptedMasterKey looks like the canonical
// AES-GCM 3-part hex format (iv:tag:data). Placeholders like
// "YOUR_TWILIO_SID:..." or ":" are not real ciphertext and will fail
// decryption cleanly; better to skip them and surface a clear report.
const HEX_PART = /^[0-9a-f]+$/i;
function looksEncrypted(s) {
  if (typeof s !== "string") return false;
  const parts = s.split(":");
  if (parts.length !== 3) return false;
  return parts.every((p) => p.length > 0 && HEX_PART.test(p));
}

const placeholderRows = [];
for (const row of rows) {
  if (!looksEncrypted(row.encryptedMasterKey)) {
    placeholderRows.push(row);
    continue;
  }
  const [ivHex] = row.encryptedMasterKey.split(":");
  const ivBytes = ivHex.length / 2;
  if (ivBytes === 12) {
    console.log(`  skip ${row._id}: already 12-byte IV`);
    skipped++;
    continue;
  }
  try {
    const plain = decryptKey(row.encryptedMasterKey);
    const fresh = encryptKey(plain);
    convexRun("missionRunner:patchEncryptedMasterKey", {
      rowId: row._id,
      encryptedMasterKey: fresh,
    });
    console.log(`  migrated ${row._id}: ${ivBytes}-byte IV -> 12-byte IV`);
    migrated++;
  } catch (e) {
    console.error(`  FAILED ${row._id}: ${e.message}`);
  }
}

if (placeholderRows.length > 0) {
  console.log(
    `\nSkipped ${placeholderRows.length} placeholder/non-encrypted row(s) - real ciphertext required before they can be migrated:`,
  );
  for (const row of placeholderRows.slice(0, 5)) {
    const sample = String(row.encryptedMasterKey).slice(0, 40);
    console.log(`    ${row._id}  "${sample}${row.encryptedMasterKey.length > 40 ? "..." : ""}"`);
  }
  if (placeholderRows.length > 5) {
    console.log(`    ... and ${placeholderRows.length - 5} more`);
  }
}

console.log(`\nDone. migrated=${migrated} skipped=${skipped} total=${rows.length}`);
