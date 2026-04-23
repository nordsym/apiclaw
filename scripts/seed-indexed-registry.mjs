#!/usr/bin/env node
/**
 * Seed ~1500 registry entries into Convex providerAPIs as listingStatus="indexed".
 *
 * Prereqs:
 *   - Schema + seedIndexedRegistry deployed (npx convex deploy).
 *   - AUTH_ENFORCEMENT=shadow (safe to run in prod; no existing traffic impact).
 *
 * Usage:
 *   node scripts/seed-indexed-registry.mjs [--limit 1500] [--url https://...convex.cloud]
 *
 * Strategy:
 *   1. Load data/registry-final.json (20 386 entries).
 *   2. Dedupe on name, sort alphabetically, take top N.
 *   3. Post in chunks of 100 to seedIndexedRegistry:upsertBatch.
 *   4. Print cumulative inserted/skipped + final pipelineCounts snapshot.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  args.set(process.argv[i].replace(/^--/, ""), process.argv[i + 1]);
}
const LIMIT = parseInt(args.get("limit") ?? "1500", 10);
const CONVEX_URL = args.get("url") ?? "https://adventurous-avocet-799.convex.cloud";
const CHUNK = 100;

const registry = JSON.parse(readFileSync(resolve(ROOT, "data/registry-final.json"), "utf8"));
console.log(`[seed] Loaded ${registry.length} registry entries`);

const seen = new Set();
const picked = [];
for (const e of registry) {
  if (!e?.name || seen.has(e.name)) continue;
  seen.add(e.name);
  picked.push({
    name: String(e.name).slice(0, 200),
    description: String(e.description ?? "").slice(0, 500),
    category: String(e.category ?? "Other"),
    baseUrl: e.baseUrl ? String(e.baseUrl) : undefined,
  });
  if (picked.length >= LIMIT) break;
}
console.log(`[seed] Picked ${picked.length} unique entries (limit=${LIMIT})`);

async function postBatch(entries) {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: "seedIndexedRegistry:upsertBatch",
      args: { entries },
    }),
  });
  const data = await res.json();
  if (data.status !== "success") {
    throw new Error(`Convex error: ${data.errorMessage ?? JSON.stringify(data)}`);
  }
  return data.value;
}

let totalInserted = 0;
let totalSkipped = 0;
for (let i = 0; i < picked.length; i += CHUNK) {
  const batch = picked.slice(i, i + CHUNK);
  const { inserted, skipped } = await postBatch(batch);
  totalInserted += inserted;
  totalSkipped += skipped;
  console.log(
    `[seed] batch ${i / CHUNK + 1}/${Math.ceil(picked.length / CHUNK)} → inserted=${inserted} skipped=${skipped} (cum ${totalInserted}/${totalSkipped})`
  );
}

const statsRes = await fetch(`${CONVEX_URL}/api/query`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ path: "seedIndexedRegistry:pipelineCounts", args: {} }),
});
const stats = (await statsRes.json()).value;
console.log(`[seed] done. inserted=${totalInserted} skipped=${totalSkipped}`);
console.log(`[seed] pipeline:`, stats);
