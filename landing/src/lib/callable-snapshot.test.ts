import assert from "node:assert/strict";
import path from "node:path";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { loadCallableSnapshot, buildCallableSnapshot, applyCallableSnapshot, renderLiveSkill, callableLabel } = require("./callable-snapshot.ts") as typeof import("./callable-snapshot");
async function main() {
const publicApis = JSON.parse(readFileSync("landing/src/lib/workspace-public-apis.json", "utf8"));
const approved = publicApis[0];
assert.ok(approved);
const baseline = buildCallableSnapshot([], null);
const fetcher: typeof fetch = async (_url, init) => {
  assert.equal(init?.cache, "no-store");
  assert.deepEqual(JSON.parse(String(init?.body)), { path: "publicApiHealth:snapshot", args: {} });
  return Response.json({ status: "success", value: { approvedIds: publicApis.map((api: any) => api.id), disabledIds: [approved.id], checkedAt: 1_792_000_000_000 } });
};
const demoted = await loadCallableSnapshot(fetcher);
assert.equal(demoted.available, true);
assert.equal(demoted.callableCount, baseline.callableCount! - 1);
assert.equal(demoted.activePublicIds.includes(approved.id), false);
// A backend rollout may remove an API before the landing manifest is deployed.
const removedByBackend = buildCallableSnapshot([], null, publicApis.filter((api: any) => api.id !== approved.id).map((api: any) => api.id));
assert.equal(removedByBackend.callableCount, baseline.callableCount! - 1);
assert.equal(removedByBackend.activePublicIds.includes(approved.id), false);
const rows = applyCallableSnapshot([
  { name: approved.name, callable: true, managedAdapter: false },
  { name: "OpenRouter", callable: true, managedAdapter: true },
  { name: "Discovery-only customer listing", callable: false, managedAdapter: false },
], demoted);
assert.equal(rows[0].callable, false);
assert.equal(rows[1].callable, true);
assert.equal(rows[2].callable, false);
const template = readFileSync("landing/public/SKILL.md", "utf8");
assert.ok(renderLiveSkill(template, demoted).includes(`- ${demoted.callableCount!.toLocaleString("en-US")} callable`));
assert.equal(callableLabel(demoted.callableCount), `${demoted.callableCount!.toLocaleString("en-US")} callable now`);
const networkFailure = await loadCallableSnapshot(async () => { throw new Error("network unavailable"); });
assert.equal(networkFailure.callableCount, null);
assert.equal(networkFailure.available, false);
assert.doesNotMatch(renderLiveSkill(template, networkFailure), /^- [\d,]+ callable$/m);
assert.match(renderLiveSkill(template, networkFailure), /Callable availability temporarily unavailable/);
const missing = await loadCallableSnapshot(async () => Response.json({ status: "error", errorMessage: "Could not find public function for 'publicApiHealth:snapshot'. Did you forget to run convex deploy?" }, { status: 400 }));
assert.equal(missing.available, false);
assert.equal(missing.callableCount, null);
const wrongMissing = await loadCallableSnapshot(async () => Response.json({ status: "error", errorMessage: "Could not find public function for 'another:snapshot'." }, { status: 400 }));
assert.equal(wrongMissing.available, false);
const invalid = await loadCallableSnapshot(async () => Response.json({ status: "success", value: { approvedIds: publicApis.map((api: any) => api.id), disabledIds: "not-an-array", checkedAt: null } }));
assert.equal(invalid.available, false);
// Exercise the actual Next handlers against one shared synthetic health state.
const { GET: catalogGet } = require("../app/api/catalog/route.ts");
const { GET: skillGet } = require("../app/api/skill/route.ts");
const { NextRequest } = require("../../node_modules/next/server");
const nativeFetch = globalThis.fetch;
const root = process.cwd();
let disabledIds = [approved.id];
let backendApprovedIds = publicApis.map((api: any) => api.id);
let healthUnavailable = false;
try {
  globalThis.fetch = async (_url, options) => {
    const query = JSON.parse(String(options?.body));
    if (query.path === "publicApiHealth:snapshot") {
      if (healthUnavailable) throw new Error("Synthetic health outage");
      return Response.json({ status: "success", value: { approvedIds: backendApprovedIds, disabledIds, checkedAt: 1_792_000_000_000 } });
    }
    assert.equal(query.path, "discoveryListings:published");
    return Response.json({ status: "success", value: { page: [], isDone: true, continueCursor: "" } });
  };
  process.chdir(path.join(root, "landing"));
  const catalogResponse = await catalogGet(new NextRequest("https://preview.example/api/catalog?callable=true&limit=100"));
  assert.equal(catalogResponse.status, 200);
  const catalog = await catalogResponse.json();
  assert.equal(catalog.totalCallable, demoted.callableCount);
  assert.equal(catalog.items.some((row: any) => row.name.toLowerCase() === approved.name.toLowerCase()), false);
  const skillResponse = await skillGet();
  assert.equal(skillResponse.headers.get("Cache-Control"), "no-store");
  assert.ok((await skillResponse.text()).includes(`- ${catalog.totalCallable.toLocaleString("en-US")} callable`));
  disabledIds = [];
  const restored = await catalogGet(new NextRequest("https://preview.example/api/catalog?callable=true&limit=100"));
  const restoredBody = await restored.json();
  assert.equal(restoredBody.totalCallable, baseline.callableCount);
  const publicCard = restoredBody.items.find((row: any) => row.name.toLowerCase() === approved.name.toLowerCase());
  assert.equal(publicCard.baseUrl, approved.baseUrl);
  assert.equal(publicCard.auth, "none (public reads)");
  assert.equal(publicCard.pricing, "free");
  assert.deepEqual(publicCard.actions, ["get"]);
  backendApprovedIds = backendApprovedIds.filter((id: string) => id !== approved.id);
  const backendRemoved = await (await catalogGet(new NextRequest("https://preview.example/api/catalog?callable=true"))).json();
  assert.equal(backendRemoved.totalCallable, baseline.callableCount! - 1);
  assert.ok((await (await skillGet()).text()).includes(`- ${backendRemoved.totalCallable.toLocaleString("en-US")} callable`));
  healthUnavailable = true;
  assert.equal((await catalogGet(new NextRequest("https://preview.example/api/catalog"))).status, 503);
  assert.match(await (await skillGet()).text(), /Callable availability temporarily unavailable/);
} finally { globalThis.fetch = nativeFetch; process.chdir(root); }
for (const file of ["landing/src/app/page.tsx", "landing/src/app/catalog/page.tsx", "landing/src/app/docs/page.tsx", "landing/src/app/layout.tsx", "landing/src/app/api/catalog/route.ts", "landing/src/app/api/skill/route.ts"]) {
  assert.match(readFileSync(file, "utf8"), /getCallableSnapshot/, `${file} must share the same live snapshot`);
}
assert.match(readFileSync("landing/src/app/catalog/CatalogClient.tsx", "utf8"), /useState<number \| null>\(initialCallableCount\)/);
assert.match(readFileSync("landing/middleware.ts", "utf8"), /pathname === "\/SKILL\.md"/);
console.log("Callable snapshot: shared SSR count, health demotion, managed preservation, dynamic SKILL and honest unavailable/rollout states passed");

}
void main().catch((error) => { console.error(error); process.exitCode = 1; });
