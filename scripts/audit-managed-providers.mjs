#!/usr/bin/env node
import { execFileSync } from "node:child_process";

const prod = process.argv.includes("--prod");
const args = ["convex", "run", "providerAudit:snapshot", "{}"];
if (prod) args.push("--prod");

let snapshot;
try {
  const raw = execFileSync("npx", args, {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 10 * 1024 * 1024,
  });
  snapshot = JSON.parse(raw);
} catch {
  console.error("Managed provider audit failed. Deploy providerAudit:snapshot to the selected Convex environment, then retry.");
  process.exit(1);
}

const minimumCalls = snapshot.minimumCallsForHealthVerdict ?? 5;
const maximumHealthAgeMs = snapshot.maximumHealthAgeMs ?? 6 * 60 * 60 * 1000;
const rows = snapshot.providers.map((provider) => {
  const structural = provider.credentialConfigured && provider.adapterRegistered;
  const health = provider.passiveHealth;
  const healthIsFresh = Boolean(health && snapshot.generatedAt - health.computedAt <= maximumHealthAgeMs);
  let verdict;
  if (!structural) verdict = "structurally_broken";
  else if (provider.surface === "internal" || provider.surface === "embeddings") verdict = "configured";
  else if (!health || health.callCount < minimumCalls) verdict = "unobserved";
  else if (!healthIsFresh) verdict = "stale_signal";
  else verdict = health.successRate >= 0.95 ? "provider_signal_healthy" : "provider_signal_failing";

  return {
    provider: provider.id,
    surface: provider.surface,
    credential: provider.credentialConfigured ? "present" : "missing",
    adapter: provider.adapterRegistered ? "yes" : "no",
    live_routes: provider.liveRouteCount,
    actions: provider.enabledActionCount,
    models: provider.modelCount,
    calls_30d: health?.callCount ?? 0,
    success_rate: health ? `${(health.successRate * 100).toFixed(1)}%` : "unknown",
    action_proof: provider.enabledActionCount > 0 ? "not_tested" : "none_registered",
    verdict,
  };
});

console.table(rows);
const counts = rows.reduce((acc, row) => {
  acc[row.verdict] = (acc[row.verdict] ?? 0) + 1;
  return acc;
}, {});
console.log(JSON.stringify({
  generatedAt: new Date(snapshot.generatedAt).toISOString(),
  unmappedLiveRoutes: snapshot.unmappedLiveRoutes ?? 0,
  counts,
}, null, 2));
console.log("No upstream provider calls were made. Provider-level passive history does not verify individual actions. Credential presence does not prove current validity, scope, quota, or entitlement.");

if (
  (snapshot.unmappedLiveRoutes ?? 0) > 0 ||
  rows.some((row) => row.verdict === "structurally_broken" || row.verdict === "provider_signal_failing")
) {
  process.exitCode = 2;
}
