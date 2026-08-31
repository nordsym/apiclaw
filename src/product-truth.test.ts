import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { CANON_STATS } from "./canon-stats.js";
import {
  FREE_MANAGED_CALLS_LIFETIME,
  FREE_MANAGED_PROVIDER_COST_CAP_USD,
  FREE_MANAGED_WARNING_AT,
  MANAGED_PROVIDER_ADAPTER_COUNT,
  MANAGED_PROVIDER_ADAPTERS,
  APILAYER_CUSTOMER_EXECUTABLE_ACTIONS,
  APILAYER_PAID_PLAN_ONLY_ACTIONS,
  APILAYER_SUBSCRIPTION_BLOCKED_ACTIONS,
  PUBLIC_CUSTOMER_EXECUTABLE_PROVIDER_COUNT,
  PUBLIC_CUSTOMER_EXECUTABLE_PROVIDERS,
  MANAGED_USAGE_POLICY,
  PAYG_MARGIN_RATE,
  getManagedProviderAdapter,
  getPublicCustomerExecutableProvider,
  isPublicCustomerExecutableAction,
} from "./product-truth.js";

assert.equal(FREE_MANAGED_CALLS_LIFETIME, 25);
assert.equal(FREE_MANAGED_PROVIDER_COST_CAP_USD, 1);
assert.equal(FREE_MANAGED_WARNING_AT, 20);
assert.equal(PAYG_MARGIN_RATE, 0.15);
assert.deepEqual(MANAGED_USAGE_POLICY, {
  freeManagedCallsLifetime: 25,
  freeManagedProviderCostCapUsd: 1,
  freeManagedWarningAt: 20,
  freeForeverZeroCost: true,
  paidCallRequiresCard: true,
  discoveryIsFree: true,
  keylessPublicExecutionAvailable: false,
  workspaceAuthenticatedPublicExecutionAvailable: true,
  paygMarginRate: 0.15,
  paygPriceBasis: "provider_cost",
  paygRequiresBillingGradeAdapter: true,
});

assert.equal(PUBLIC_CUSTOMER_EXECUTABLE_PROVIDER_COUNT, 22);
assert.equal(MANAGED_PROVIDER_ADAPTER_COUNT, 22);
assert.equal(CANON_STATS.discoverable, 26_619);
assert.equal(CANON_STATS.source_verified, 689);
assert.equal(CANON_STATS.verification_sweep_passes, 2_895);
assert.equal(CANON_STATS.managed_provider_adapters, MANAGED_PROVIDER_ADAPTER_COUNT);
assert.equal(
  CANON_STATS.customer_executable_providers,
  PUBLIC_CUSTOMER_EXECUTABLE_PROVIDER_COUNT,
);
assert.equal(CANON_STATS.workspace_public_executable, 1_003);
assert.equal(CANON_STATS.customer_executable_catalog_cards, 1_025);
assert.equal(CANON_STATS.npm_installs, 20_058);
assert.equal(new Set(MANAGED_PROVIDER_ADAPTERS.map(({ id }) => id)).size, 22);
assert.deepEqual(
  MANAGED_PROVIDER_ADAPTERS.filter(({ id }) =>
    ["together", "twilio", "46elks", "resend"].includes(id),
  ),
  [],
);
assert.deepEqual(
  PUBLIC_CUSTOMER_EXECUTABLE_PROVIDERS.map(({ id }) => id),
  [
    "openrouter",
    "groq",
    "mistral",
    "deepinfra",
    "openai",
    "xai",
    "anthropic",
    "cohere",
    "brave_search",
    "serper",
    "elevenlabs",
    "deepgram",
    "assemblyai",
    "replicate",
    "stability",
    "firecrawl",
    "genprd",
    "github",
    "e2b",
    "nasa",
    "apilayer",
    "voyage",
  ],
);
assert.deepEqual(getPublicCustomerExecutableProvider("OpenRouter")?.customerExecutableActions, ["chat"]);
assert.deepEqual(getPublicCustomerExecutableProvider("Groq")?.customerExecutableActions, ["chat"]);
assert.deepEqual(getPublicCustomerExecutableProvider("Anthropic")?.customerExecutableActions, ["chat", "messages"]);
assert.deepEqual(getPublicCustomerExecutableProvider("Firecrawl")?.customerExecutableActions, ["scrape", "crawl", "map"]);
assert.deepEqual(getPublicCustomerExecutableProvider("APILayer")?.customerExecutableActions, [...APILAYER_CUSTOMER_EXECUTABLE_ACTIONS]);
assert.equal(getPublicCustomerExecutableProvider("GitHub API")?.id, "github");
assert.equal(getManagedProviderAdapter("AssemblyAI")?.id, "assemblyai");
assert.equal(getPublicCustomerExecutableProvider("AssemblyAI")?.id, "assemblyai");
assert.equal(isPublicCustomerExecutableAction("Brave Search", "search"), true);
assert.equal(isPublicCustomerExecutableAction("github", "create_issue"), false);
assert.equal(isPublicCustomerExecutableAction("replicate", "run"), true);
assert.equal(isPublicCustomerExecutableAction("voyage", "embeddings"), true);
assert.equal(isPublicCustomerExecutableAction("elevenlabs", "text_to_speech"), true);
assert.equal(isPublicCustomerExecutableAction("e2b", "run_code"), true);
assert.equal(isPublicCustomerExecutableAction("apilayer", "weatherstack_current"), true);
assert.equal(isPublicCustomerExecutableAction("apilayer", "fixer_latest"), true);
for (const action of APILAYER_SUBSCRIPTION_BLOCKED_ACTIONS) {
  assert.equal(
    isPublicCustomerExecutableAction("apilayer", action),
    false,
    `${action} is subscription-blocked and must stay inventory-only`,
  );
}
for (const action of APILAYER_PAID_PLAN_ONLY_ACTIONS) {
  assert.equal(
    isPublicCustomerExecutableAction("apilayer", action),
    false,
    `${action} is paid-plan-only and must stay inventory-only`,
  );
}

const executeSource = readFileSync("src/execute.ts", "utf8");
assert.match(executeSource, /PUBLIC_CUSTOMER_EXECUTABLE_PROVIDERS/);
assert.doesNotMatch(
  executeSource.slice(executeSource.indexOf("export function getConnectedProviders")),
  /Object\.entries\(handlers\)/,
  "list_connected must not infer customer execution from credentialed handlers",
);

for (const catalogFile of [
  "landing/src/app/catalog/page.tsx",
  "landing/src/app/api/catalog/route.ts",
]) {
  const source = readFileSync(catalogFile, "utf8");
  assert.match(source, /@apiclaw\/product-truth/);
  assert.doesNotMatch(
    source,
    /OpenAI[^\n]+callable:\s*true|AssemblyAI[^\n]+callable:\s*true|Replicate[^\n]+callable:\s*true/,
    `${catalogFile} must not promote credential presence to customer execution`,
  );
}

const activeTruthSurfaces = [
  "README.md",
  "apiclaw-README.md",
  "src/index.ts",
  "convex/http.ts",
  "convex/email.ts",
  "convex/nurture.ts",
  "convex/postVerifyNudge.ts",
  "convex/adminStats.ts",
  "landing/src/lib/plans.ts",
  "landing/src/app/page.tsx",
  "landing/src/app/workspace/page.tsx",
  "landing/src/components/CheckoutButton.tsx",
  "landing/public/llms.txt",
  "landing/public/agents.md",
  "landing/public/SKILL.md",
];

const staleManagedAllowance = /(?:50 (?:free )?managed calls|25 calls per month|managed calls? (?:per|\/)(?:\s*)(?:week|month)|managed-call allowance (?:per|\/)(?:\s*)(?:week|month)|weekly managed call quota|monthly free tier|free API calls this month|\$0\.002\/call|\$0\.002 per API call|unlock unlimited usage)/i;
const staleExecutionClaim = /keyless public (?:API )?calls (?:stay|are|remain) free|public APIs proxied through APIClaw without auth/i;

for (const file of activeTruthSurfaces) {
  const content = readFileSync(file, "utf8");
  assert.doesNotMatch(content, staleManagedAllowance, `${file} contains stale managed-usage truth`);
  assert.doesNotMatch(content, staleExecutionClaim, `${file} claims disabled keyless proxy execution`);
}

for (const file of ["convex/quota.ts", "convex/managedUsagePolicy.ts"]) {
  assert.match(
    readFileSync(file, "utf8"),
    /FREE_MANAGED_CALLS_LIFETIME/,
    `${file} must consume the canonical lifetime allowance`,
  );
}
assert.doesNotMatch(
  readFileSync("src/index.ts", "utf8"),
  /FREE_MANAGED_CALLS_LIFETIME|FREE_MANAGED_PROVIDER_COST_CAP_USD/,
  "src/index.ts must derive Free/Paid API copy without importing the retired lifetime-call constants",
);
assert.match(
  readFileSync("convex/adminStats.ts", "utf8"),
  /getWorkspaceUsageDisplay[\s\S]*?FREE_MANAGED_PROVIDER_COST_CAP_USD/,
  "operator usage must consume canonical lifetime and provider-cost policy",
);

const planCopy = readFileSync("landing/src/lib/plans.ts", "utf8");
assert.match(planCopy, /Free APIs/);
assert.match(planCopy, /Paid APIs/);
assert.match(planCopy, /PAYG_MARGIN_RATE/);
assert.doesNotMatch(
  planCopy,
  /FREE_MANAGED_CALLS_LIFETIME|FREE_MANAGED_PROVIDER_COST_CAP_USD|lifetime of the workspace/,
  "plans.ts must not reference the retired lifetime-call allowance",
);

for (const file of ["README.md", "apiclaw-README.md", "landing/public/llms.txt", "landing/public/agents.md", "landing/public/SKILL.md"]) {
  const content = readFileSync(file, "utf8");
  assert.match(content, /Free APIs?[^\n]*free forever/i, `${file} must state Free APIs are free forever`);
  assert.match(content, /add a card/i, `${file} must state Paid APIs require a card`);
  assert.match(content, /provider cost (?:plus|\+) 15%|API cost plus 15%/i, `${file} must state the PAYG margin`);
  assert.doesNotMatch(
    content,
    /25 (?:lifetime )?managed calls|\$1 (?:total )?(?:underlying )?provider-cost cap|managed adapter/i,
    `${file} must not state the retired free-tier cap or "managed adapter"`,
  );
}

const workspacePage = [
  readFileSync("landing/src/app/workspace/page.tsx", "utf8"),
  readFileSync("landing/src/components/WorkspaceCatalog.tsx", "utf8"),
  readFileSync("landing/src/lib/workspace-truth.ts", "utf8"),
].join("\n");
// Workspace rebuild (137d5c4, 2026-08-23) renamed the tab from "Catalog & Test" to "Catalog".
// Agents-home restructure (2026-08-24) makes Agents the default view and dissolves the
// standalone Home and Connections tabs (their content folded into Agents/Settings).
for (const label of ["Agents", "Catalog", "Activity", "Billing", "Settings"]) {
  assert.match(workspacePage, new RegExp(`\\b${label.replace("&", "\\&")}\\b`), `workspace is missing ${label}`);
}
assert.doesNotMatch(workspacePage, /Together(?: AI)?/, "retired provider must not appear in workspace UI");
assert.doesNotMatch(workspacePage, /workspaces:setPassword|Change Password/, "legacy password UI must not be reachable");
assert.doesNotMatch(readFileSync("convex/workspaces.ts", "utf8"), /export const setPassword/, "legacy password mutation must not be exported");
assert.equal(existsSync("landing/public/dev-login.html"), false, "public dev login artifact must not ship");
assert.equal(existsSync("landing/public/.well-known/ai-plugin.json"), false, "obsolete no-auth ChatGPT plugin manifest must not ship");

const packageMetadata = JSON.parse(readFileSync("package.json", "utf8")) as {
  version: string;
  description: string;
  scripts: Record<string, string>;
  bin: Record<string, string>;
};
const packageLock = JSON.parse(readFileSync("package-lock.json", "utf8")) as {
  version: string;
  packages: Record<string, { version?: string; bin?: Record<string, string> }>;
};
assert.equal(packageMetadata.version, "2.9.9");
assert.equal(packageLock.version, "2.9.9");
assert.equal(packageLock.packages[""].version, "2.9.9");
assert.match(packageMetadata.description, /26,619 API definitions/);
assert.match(packageMetadata.description, /689 exact-name source-verified entries/);
assert.match(packageMetadata.description, /Source verification is not execution/);
assert.match(packageMetadata.description, /22 built-in providers/);
assert.match(packageMetadata.description, /all customer-executable today/);
for (const healthFile of ["api/health.ts", "landing/pages/api/health.ts"]) {
  const health = readFileSync(healthFile, "utf8");
  assert.match(health, /service: 'apiclaw-gateway'/);
    assert.match(health, /version: '2\.9\.9'/);
}
assert.deepEqual(packageMetadata.bin, { apiclaw: "./dist/bin.js" });
assert.equal("start:http" in packageMetadata.scripts, false, "retired local HTTP server must not ship as an npm script");
assert.deepEqual(packageLock.packages[""].bin, { apiclaw: "dist/bin.js" });
for (const retiredSource of [
  "src/bin-http.ts",
  "src/http-api.ts",
  "src/http-server-minimal.ts",
  "src/metered.ts",
  "src/access-control.ts",
  "src/hivr-whitelist.ts",
  "src/product-whitelist.ts",
  "api/discover.ts",
]) {
  assert.equal(existsSync(retiredSource), false, `${retiredSource} must not ship`);
}
for (const retiredBuild of ["dist/bin-http.js", "dist/http-api.js", "dist/http-server-minimal.js", "dist/metered.js"]) {
  assert.equal(existsSync(retiredBuild), false, `${retiredBuild} must not remain in the release build`);
}
for (const releaseSurface of ["package.json", "package-lock.json", "HTTP-API.md"]) {
  assert.doesNotMatch(
    readFileSync(releaseSurface, "utf8"),
    /\bapiclaw-http\b|start:http|bin-http/,
    `${releaseSurface} must not advertise the retired local HTTP server`,
  );
}
assert.match(readFileSync("HTTP-API.md", "utf8"), /https:\/\/api\.apiclaw\.cloud\/v1\/execute/);

const publicDiscoveryCopyFiles = [
  "package.json",
  "landing/src/app/.well-known/mcp/route.ts",
  "landing/mcpb/manifest.json",
  "landing/src/lib/mcp-tools-canon.ts",
  "landing/public/.well-known/openapi.json",
  "landing/public/stats.json",
  "landing/src/app/api/catalog/route.ts",
  "src/canon-stats.ts",
  "src/discovery.ts",
  "landing/public/SKILL.md",
];
for (const file of publicDiscoveryCopyFiles) {
  const content = readFileSync(file, "utf8");
  assert.doesNotMatch(
    content,
    /2,?906\+?\s+(?:APIs?\s+)?(?:are\s+)?(?:callable|executable)|2\.9k\s+(?:callable|executable)|empirically callable|universal pass-through proxy/i,
    `${file} turns source verification into an execution claim`,
  );
  assert.doesNotMatch(
    content,
    /\b(?:Together(?: AI)?|46elks|Twilio|Resend)\b/i,
    `${file} exposes a retired or internal-only provider`,
  );
}

const publicStats = JSON.parse(readFileSync("landing/public/stats.json", "utf8")) as Record<string, unknown>;
assert.equal(publicStats.apiCount, CANON_STATS.discoverable);
assert.equal(publicStats.sourceVerifiedCount, CANON_STATS.source_verified);
assert.equal(publicStats.managedProviderAdapterCount, MANAGED_PROVIDER_ADAPTER_COUNT);
assert.equal(
  publicStats.customerExecutableProviderCount,
  PUBLIC_CUSTOMER_EXECUTABLE_PROVIDER_COUNT,
);
assert.equal(publicStats.npmDownloads, CANON_STATS.npm_installs);
assert.equal("callableCount" in publicStats, false, "public stats must not expose the legacy callableCount label");

const sourceStats = JSON.parse(readFileSync("landing/src/lib/stats.json", "utf8")) as Record<string, unknown>;
assert.equal(sourceStats.apiCount, publicStats.apiCount);
assert.equal(sourceStats.sourceVerifiedCount, publicStats.sourceVerifiedCount);
assert.equal(sourceStats.managedProviderAdapterCount, publicStats.managedProviderAdapterCount);
assert.equal(sourceStats.customerExecutableProviderCount, publicStats.customerExecutableProviderCount);
assert.equal(sourceStats.npmDownloads, publicStats.npmDownloads);
assert.equal("callableCount" in sourceStats, false, "source stats must not expose the legacy callableCount label");
assert.equal(
  (sourceStats.historicalVerificationBuckets as { verified: number }).verified,
  CANON_STATS.verification_sweep_passes,
  "historical sweep passes must remain separate from safely mapped source verification",
);
assert.equal(
  Object.values(publicStats.categoryBreakdown as Record<string, number>)
    .reduce((sum, count) => sum + count, 0),
  CANON_STATS.discoverable,
  "public category counts must cover the exact public catalog inventory",
);

const catalogRoute = readFileSync("landing/src/app/api/catalog/route.ts", "utf8");
assert.match(catalogRoute, /CANON_STATS/);
assert.match(
  catalogRoute,
  /customerExecutable: CANON_STATS\.customer_executable_catalog_cards/,
  "catalog load must assert callable catalog cards against canon",
);
assert.match(catalogRoute, /assertPublicCatalogTruth\(cachedApis, verification\)/);
assert.doesNotMatch(
  catalogRoute,
  /by_host/,
  "shared-host fallback must not mark unrelated catalog cards as source-verified",
);
const statsGenerator = readFileSync("landing/scripts/generate-stats.js", "utf8");
assert.match(statsGenerator, /buildPublicInventory/);
assert.doesNotMatch(
  statsGenerator,
  /CANON_(?:API_COUNT|SOURCE_VERIFIED|MANAGED_PROVIDER_ADAPTERS)/,
  "the measured generator must not carry a second copy of catalog canon",
);
const statsSync = readFileSync("landing/scripts/sync-canon-to-stats.mjs", "utf8");
assert.match(statsSync, /CANON_STATS_PATH/);
assert.match(statsSync, /drift: measured=/);

const publicOpenApi = JSON.parse(readFileSync("landing/public/.well-known/openapi.json", "utf8")) as {
  paths: Record<string, unknown>;
};
for (const internalPath of ["/proxy/46elks", "/proxy/twilio", "/proxy/resend", "/proxy/together"]) {
  assert.equal(internalPath in publicOpenApi.paths, false, `${internalPath} must not appear in the public OpenAPI document`);
}

assert.match(
  readFileSync("convex/http.ts", "utf8"),
  /Access-Control-Allow-Headers[^\n]+Idempotency-Key/,
  "browser managed calls must be allowed to send their idempotency key",
);
const onboardingWizard = readFileSync("landing/src/components/OnboardingWizard.tsx", "utf8");
assert.match(
  onboardingWizard,
  /"Idempotency-Key": idempotencyKey/,
  "the golden first managed call must be idempotent",
);
assert.match(
  onboardingWizard,
  /ONBOARDING_OVERLAY_CLASS|backdrop-blur-2xl/,
  "onboarding must frost the workspace, not only dim it",
);
assert.doesNotMatch(
  onboardingWizard,
  /provider:\s*"brave_search"|brave_search\/search/,
  "onboarding must not send first execute to billed Brave",
);

const mcpbManifest = JSON.parse(readFileSync("landing/mcpb/manifest.json", "utf8")) as {
  version: string;
  tools: Array<{ name: string }>;
};
assert.equal(mcpbManifest.version, "2.9.9");
assert.doesNotMatch(
  mcpbManifest.tools.map((tool) => tool.name).join(" "),
  /\b(?:estimate_cost|get_usage_summary)\b/,
  "the desktop extension manifest must match the implemented MCP tool surface",
);

console.log("product truth: Free APIs free forever no card, Paid APIs provider cost + 15% metered per call after a card");
