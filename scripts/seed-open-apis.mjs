#!/usr/bin/env node
/**
 * Seed the 1,635 keyless Open APIs from landing/src/lib/apis.json into
 * Convex providerAPIs with listingStatus="live", authType="none",
 * proxyMode="open_proxy".
 *
 * IRONCLAD RULES:
 *   - Never deletes rows.
 *   - Never touches workspaces / apiKeys / agentSessions / analytics.
 *   - pipelineAlign:upsertOpenAPIs is idempotent — safe to run repeatedly.
 *
 * Usage:
 *   node scripts/seed-open-apis.mjs [--url https://...convex.cloud] [--chunk 100]
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
const CONVEX_URL = args.get("url") ?? "https://adventurous-avocet-799.convex.cloud";
const CHUNK = parseInt(args.get("chunk") ?? "100", 10);

const apisPath = resolve(ROOT, "landing/src/lib/apis.json");
const registry = JSON.parse(readFileSync(apisPath, "utf8"));
console.log(`[seed-open] Loaded ${registry.count} registry entries from ${apisPath}`);

// Select: callable:true AND auth in ("none", "None", "", null) — the keyless set.
const seen = new Set();
const picked = [];
for (const api of registry.apis ?? []) {
  const rawAuth = (api.auth ?? "").toString().trim().toLowerCase();
  const isKeyless = api.callable === true && (rawAuth === "" || rawAuth === "none");
  if (!isKeyless) continue;
  if (!api.name || !api.baseUrl) continue;
  if (seen.has(api.name)) continue; // dedupe by name — upsert is name-keyed
  seen.add(api.name);
  picked.push({
    name: String(api.name).slice(0, 200),
    description: String(api.description ?? "").slice(0, 500),
    category: String(api.category ?? "Other").slice(0, 100),
    baseUrl: String(api.baseUrl),
    docsUrl: api.docsUrl ? String(api.docsUrl) : undefined,
  });
}
console.log(`[seed-open] Selected ${picked.length} keyless open APIs for upsert`);

async function postBatch(entries) {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: "pipelineAlign:upsertOpenAPIs",
      args: { entries },
    }),
  });
  const data = await res.json();
  if (data.status !== "success") {
    throw new Error(`Convex error: ${data.errorMessage ?? JSON.stringify(data)}`);
  }
  return data.value;
}

let inserted = 0;
let patched = 0;
let unchanged = 0;
for (let i = 0; i < picked.length; i += CHUNK) {
  const batch = picked.slice(i, i + CHUNK);
  const r = await postBatch(batch);
  inserted += r.inserted;
  patched += r.patched;
  unchanged += r.unchanged;
  console.log(
    `[seed-open] batch ${i / CHUNK + 1}/${Math.ceil(picked.length / CHUNK)} → inserted=${r.inserted} patched=${r.patched} unchanged=${r.unchanged}`
  );
}

const statsRes = await fetch(`${CONVEX_URL}/api/query`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ path: "pipelineAlign:funnelCounts", args: {} }),
});
const snap = (await statsRes.json()).value;
console.log(`[seed-open] done. inserted=${inserted} patched=${patched} unchanged=${unchanged}`);
console.log(`[seed-open] funnel:`, snap);
