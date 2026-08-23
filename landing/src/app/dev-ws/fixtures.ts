/**
 * DEV-ONLY fixtures for /dev-ws. Not shipped: the route 404s in production.
 * Keyed by Convex function path. Views call POST {CONVEX_URL}/api/query|mutation
 * with { path, args }; the harness answers from this map. Unknown paths get { value: null }.
 * Agents: add the shapes your view reads. Keep numbers plausible, never real customers.
 */
import type { Agent, ConnectedAgent, ProviderAPI, UsageData, Workspace } from "../workspace/_shared";

const NOW = Date.now();
const H = 3600_000;
const D = 24 * H;

export const workspace: Workspace = {
  id: "ws_dev",
  email: "dev@example.com",
  workspaceName: "Dev workspace",
  tier: "free",
  status: "active",
  usageCount: 9,
  usageLimit: 25,
  usageRemaining: 16,
  usagePercentage: 36,
  createdAt: NOW - 12 * D,
};

export const agents: Agent[] = [
  { id: "ag_1", fingerprint: "claude-desktop · mbp-gustav", name: "Claude Desktop", customName: null, lastUsedAt: NOW - 5 * 60_000, createdAt: NOW - 10 * D, isCurrent: true },
  { id: "ag_2", fingerprint: "codex-cli · ci-runner", name: "Codex CLI", customName: "CI runner", lastUsedAt: NOW - 2 * D, createdAt: NOW - 8 * D, isCurrent: false },
];

/** agents table rows as returned by agents:getWorkspaceAgents (Connections view). */
export const connectedAgents: ConnectedAgent[] = [
  { id: "ag_1", fingerprint: "mbp-gustav:gustav", mcpClient: "claude-desktop", name: "Claude Desktop", hostname: "mbp-gustav", aiBackend: "claude-sonnet-4", platform: "darwin", callCount: 7, firstSeenAt: NOW - 10 * D, lastActiveAt: NOW - 5 * 60_000 },
  { id: "ag_2", fingerprint: "ci-runner:ci", mcpClient: "claude-code", name: undefined, hostname: "ci-runner", platform: "linux", callCount: 2, firstSeenAt: NOW - 8 * D, lastActiveAt: NOW - 2 * D },
];

export const providerApis: ProviderAPI[] = [
  { _id: "api_1", name: "Acme Weather", description: "Hourly forecasts for Nordic cities.", category: "Weather", status: "approved", discoveryCount: 41, hasDirectCall: true },
  { _id: "api_2", name: "Acme Geocode", description: "Address to coordinates.", category: "Location & Maps", status: "pending", discoveryCount: 3 },
];

export const usage: UsageData = {
  byProvider: [
    { provider: "nasa", calls: 4, cost: 0 },
    { provider: "frankfurter", calls: 3, cost: 0 },
    { provider: "openrouter", calls: 2, cost: 0.012 },
  ],
  byDay: Array.from({ length: 14 }, (_, i) => ({ date: new Date(NOW - (13 - i) * D).toISOString().slice(0, 10), calls: [0, 1, 0, 2, 1, 0, 0, 1, 0, 1, 2, 0, 0, 1][i] })),
  total: 9,
};

// Shape of convex/logs.ts getLogs: { logs, hasMore, nextCursor }. subagentId null = main agent.
const apiLogs = [
  { id: "l1", provider: "nasa", action: "apod", status: "success", latencyMs: 412, errorMessage: undefined, subagentId: null, costCents: 0.42, createdAt: NOW - 5 * 60_000 },
  { id: "l2", provider: "frankfurter", action: "latest", status: "success", latencyMs: 188, errorMessage: undefined, subagentId: "research", costCents: 1.5, createdAt: NOW - 3 * H },
  { id: "l3", provider: "openrouter", action: "chat", status: "error", latencyMs: 950, errorMessage: "429 Too Many Requests: rate limited by upstream, retry after 20s", subagentId: "research", createdAt: NOW - 2 * D },
  { id: "l4", provider: "nasa", action: "neo_feed", status: "success", latencyMs: 640, errorMessage: undefined, subagentId: null, createdAt: NOW - 3 * D },
  { id: "l5", provider: "frankfurter", action: "convert", status: "success", latencyMs: 201, errorMessage: undefined, subagentId: null, createdAt: NOW - 6 * D },
];

// Shape of convex/searchLogs.ts getRecent: array, keyed by `id`, time in `timestamp`.
const searchLogs = [
  { id: "s1", query: "exchange rates", resultCount: 12, hasResults: true, matchedProviders: ["frankfurter", "exchangerate-host"], responseTimeMs: 84, timestamp: NOW - 9 * 60_000, subagentId: null },
  { id: "s2", query: "image generation", resultCount: 0, hasResults: false, matchedProviders: [], responseTimeMs: 61, timestamp: NOW - 4 * D, subagentId: "research" },
];

// Dated from the real clock: the Usage chart plots the last 30 calendar days.
const logDays = Array.from({ length: 30 }, (_, i) => {
  const calls = [0, 1, 0, 2, 1, 0, 0, 1, 0, 1, 2, 0, 0, 1, 0, 0, 3, 1, 0, 2, 0, 1, 0, 0, 1, 0, 1, 2, 1, 1][i];
  const error = calls > 1 && i % 7 === 0 ? 1 : 0;
  return { date: new Date(Date.now() - (29 - i) * D).toISOString().slice(0, 10), calls, success: calls - error, error };
});

// Shape of convex/chains.ts getChainExecutions / getChainTraceAuth.
const chainId = "jx7chain0001dev";
const chainExecutions = [
  { _id: chainId, status: "failed", currentStep: 1, stepsCount: 2, totalCostCents: 3, totalLatencyMs: 1840, error: { stepId: "summarize", code: "PROVIDER_ERROR", message: "openrouter returned 429" }, canResume: true, resumeToken: "rt_dev", createdAt: NOW - 40 * 60_000, startedAt: NOW - 40 * 60_000, completedAt: NOW - 39 * 60_000 },
];
const chainTrace = {
  chain: { _id: chainId, status: "failed", currentStep: 1, steps: [], results: {}, error: chainExecutions[0].error, canResume: true, resumeToken: "rt_dev", totalCostCents: 3, totalLatencyMs: 1840, createdAt: chainExecutions[0].createdAt, startedAt: chainExecutions[0].startedAt, completedAt: chainExecutions[0].completedAt },
  executions: [
    { _id: "ce1", stepId: "fetch_apod", stepIndex: 0, status: "completed", input: { date: "2026-08-20" }, output: { title: "Example" }, latencyMs: 420, costCents: 0, createdAt: chainExecutions[0].createdAt, startedAt: chainExecutions[0].startedAt, completedAt: chainExecutions[0].startedAt! + 420 },
    { _id: "ce2", stepId: "summarize", stepIndex: 1, status: "failed", input: { model: "gpt" }, latencyMs: 1420, costCents: 3, error: { code: "PROVIDER_ERROR", message: "openrouter returned 429", retryCount: 1 }, createdAt: chainExecutions[0].createdAt, startedAt: chainExecutions[0].startedAt! + 420, completedAt: chainExecutions[0].completedAt },
  ],
  tokensSaved: 0,
};

// Shape of convex/billing.ts getBillingInfo (buildBillingInfo). Three
// invoices (two paid, one open with no PDF yet) and one card on file.
export const billingInfo = {
  plan: "usage_based",
  tier: "usage_based",
  usage: 41,
  currentPeriodUsage: 12,
  limit: -1,
  activationProviderCostUsd: 0,
  activationProviderCostCapUsd: 5,
  creditBalance: 0,
  stripeCustomerId: "cus_dev123",
  stripeSubscriptionId: "sub_dev123",
  lastBillingDate: NOW - 6 * D,
  currentPeriodStart: NOW - 6 * D,
  monthlySpendCents: 2140,
  invoices: [
    { id: "inv_1", stripeInvoiceId: "in_dev1", amount: 940, status: "paid", periodStart: NOW - 36 * D, periodEnd: NOW - 6 * D, callCount: 210, pdfUrl: "https://invoice.stripe.com/i/dev1", createdAt: NOW - 6 * D },
    { id: "inv_2", stripeInvoiceId: "in_dev2", amount: 620, status: "paid", periodStart: NOW - 66 * D, periodEnd: NOW - 36 * D, callCount: 140, pdfUrl: "https://invoice.stripe.com/i/dev2", createdAt: NOW - 36 * D },
    { id: "inv_3", stripeInvoiceId: "in_dev3", amount: 0, status: "open", periodStart: NOW - 96 * D, periodEnd: NOW - 66 * D, callCount: 0, pdfUrl: undefined, createdAt: NOW - 66 * D },
  ],
  paymentMethod: { brand: "visa", last4: "4242", type: "card" },
  needsPaymentMethod: false,
};

/** Map of Convex path -> response value. Functions receive args. */
export const convex: Record<string, unknown | ((args: Record<string, unknown>) => unknown)> = {
  "agents:getWorkspaceAgents": connectedAgents,
  "agents:getMainAgent": { workspaceId: "ws_dev", email: workspace.email, mainAgentId: "agent_9f3a2c", mainAgentName: "Main", aiBackend: "claude-sonnet-4", usageCount: 9, createdAt: NOW - 12 * D },
  "agents:getSubagents": { subagents: [{ id: "sub_1", subagentId: "research", name: "research", callCount: 2, firstSeenAt: NOW - 3 * D, lastActiveAt: NOW - 1 * D }], total: 1 },
  "workspaces:getConnectedAgents": [
    { id: "sess_1", fingerprint: "mbp-gustav:gustav", customName: null, name: "mbp-gustav:gustav", lastUsedAt: NOW - 5 * 60_000, createdAt: NOW - 10 * D, isCurrent: true },
    { id: "sess_2", fingerprint: "ci-runner:ci", customName: "CI runner", name: "CI runner", lastUsedAt: NOW - 2 * D, createdAt: NOW - 8 * D, isCurrent: false },
  ],
  "apiKeys:listKeys": { keys: [{ id: "key_1", name: "CI runner", keyPrefix: "sk-claw-...7f3a", createdAt: NOW - 8 * D, lastUsedAt: NOW - 2 * D }] },
  "logs:getLogs": (args: Record<string, unknown>) => {
    const status = args.status as string | undefined;
    const provider = args.provider as string | undefined;
    const subagentId = args.subagentId as string | undefined;
    const rows = apiLogs
      .filter((l) => !status || status === "all" || l.status === status)
      .filter((l) => !provider || provider === "all" || l.provider === provider)
      .filter((l) => !subagentId || (subagentId === "main" ? !l.subagentId : l.subagentId === subagentId));
    return { logs: rows, hasMore: false, nextCursor: rows.length ? rows[rows.length - 1].createdAt : undefined };
  },
  "logs:getLogStats": {
    totalCalls: apiLogs.length, successCount: 4, errorCount: 1, successRate: 80, avgLatency: 478,
    byProvider: [
      { provider: "nasa", calls: 2, successRate: 100, avgLatency: 526 },
      { provider: "frankfurter", calls: 2, successRate: 100, avgLatency: 195 },
      { provider: "openrouter", calls: 1, successRate: 0, avgLatency: 950 },
    ],
    byDay: logDays,
    providers: ["frankfurter", "nasa", "openrouter"],
    agents: ["main", "research"],
  },
  "searchLogs:getStats": { totalSearches: 2, zeroResultSearches: 1, avgResponseTimeMs: 73, successRate: 50, byDay: [{ date: new Date(NOW - 4 * D).toISOString().slice(0, 10), searches: 1 }, { date: new Date(NOW).toISOString().slice(0, 10), searches: 1 }] },
  "searchLogs:getRecent": searchLogs,
  "chains:getChainStatsAuth": { total: 1, completed: 0, failed: 1, running: 0, paused: 0, totalCostCents: 3, totalLatencyMs: 1840, totalSteps: 2, successRate: 0 },
  "chains:getChainExecutions": (args: Record<string, unknown>) => chainExecutions.filter((c) => !args.status || args.status === "all" || c.status === args.status),
  "chains:getChainTraceAuth": chainTrace,
  "chains:resumeChainAuth": { success: true, chainId },
  "workspaceSettings:get": { routingMode: "balanced", defaultModel: null, preferredProviders: ["groq", "mistral"], blockedProviders: ["together"], allowOpenRouterFallback: true, _isDefault: true },
  // Provider console: api_1 has a draft routing config the owner can edit; api_2 has none yet.
  "managedRouting:getOwnerConfigByApiId": (args: Record<string, unknown>) => (args.apiId === "api_1" ? { _id: "dc_1", apiId: "api_1", baseUrl: "https://api.acme-weather.example", authType: "api_key", authHeader: "x-api-key", authPrefix: "", rateLimitPerUser: 60, rateLimitPerDay: 5000, pricePerRequest: 0, status: "draft", allowCustomerKeys: true, requireCustomerKeys: false, encryptedMasterKey: "", hasCredential: false, createdAt: NOW - 9 * D, updatedAt: NOW - 2 * D } : null),
  "directCall:getActions": (args: Record<string, unknown>) => (args.directCallId === "dc_1" ? [
    { _id: "act_1", directCallId: "dc_1", name: "forecast", displayName: "Hourly forecast", description: "Next 48 hours for a city", method: "GET", path: "/v1/forecast", params: [], responseMapping: [], enabled: true, createdAt: NOW - 9 * D, updatedAt: NOW - 9 * D },
    { _id: "act_2", directCallId: "dc_1", name: "current", displayName: "Current conditions", description: "", method: "GET", path: "/v1/current", params: [], responseMapping: [], enabled: false, createdAt: NOW - 8 * D, updatedAt: NOW - 8 * D },
  ] : []),
  "managedRouting:saveConfig": "dc_1",
  "managedRouting:saveAction": "act_3",
  "managedRouting:deleteAction": { success: true },
  "providers:createForWorkspace": { id: "api_3" },
  // Shape = convex/logs.ts getProviderAnalytics. Same shape for inbound and outbound.
  "logs:getProviderAnalytics": { totalCalls: 41, totalDiscoveries: 44, inboundCalls: 41, uniqueCallers: 6, avgLatency: 230, successRate: 97.5,
    byDay: usage.byDay.map((d, i) => ({ ...d, calls: d.calls * 3, searches: [2, 4, 1, 5, 3, 2, 4, 3, 6, 2, 4, 3, 2, 3][i] })),
    byAction: [{ action: "forecast", calls: 33, success: 33, type: "call" }, { action: "current", calls: 8, success: 7, type: "call" }, { action: "Search: weather forecast", calls: 26, success: 26, type: "discovery" }, { action: "Search: nordic weather", calls: 18, success: 18, type: "discovery" }],
    byCaller: [
      { callerKey: "ws-4f3a9c21", calls: 19, errors: 0, lastCallAt: NOW - 1 * H },
      { callerKey: "you", calls: 12, errors: 1, lastCallAt: NOW - 3 * H },
      { callerKey: "ws-88b1de07", calls: 7, errors: 0, lastCallAt: NOW - 2 * D },
      { callerKey: "ws-0c72f5aa", calls: 3, errors: 2, lastCallAt: NOW - 6 * D },
    ] },
  "workspaces:updateWorkspaceName": { ok: true },
  "workspaceSettings:upsert": { ok: true },
  "apiKeys:revokeKey": { ok: true },
  "agents:renameMainAgent": { ok: true },
  "agents:renameSubagent": { ok: true },
  "agents:renameAgent": { success: true },
  "agents:deleteSubagent": { success: true },
  "agents:registerTaskAgent": { id: "sub_new", created: true },
  "workspaces:revokeAgentSession": { success: true },
  "onboarding:getState": { completedAt: null, dismissedAt: null, source: null, building: null },
  "onboarding:complete": { ok: true },
  "onboarding:dismiss": { ok: true },
  "billing:getBillingInfo": billingInfo,
};

const catalogItems = [
  { name: "Brave Search", description: "Web search with fresh results and source links.", category: "AI & ML", baseUrl: "https://api.search.brave.com", docsUrl: "https://brave.com/search/api/", auth: "managed", pricing: "freemium", callable: true, managedAdapter: true, providerId: "brave_search", actions: ["search"], tier: "managed", verified: false, latency_ms: null, last_verified_at: null },
  { name: "Acme Adapter", description: "Credentialed adapter, execution not enabled yet.", category: "AI & ML", baseUrl: "https://api.acme.example", docsUrl: "https://acme.example/docs", auth: "managed", pricing: "paid", callable: false, managedAdapter: true, providerId: "acme", actions: [], tier: "untested", verified: false, latency_ms: null, last_verified_at: null },
  { name: "Open Meteo", description: "Free weather forecast API with no key.", category: "Data & Analytics", baseUrl: "https://api.open-meteo.com", docsUrl: "https://open-meteo.com/en/docs", auth: "none", pricing: "free", callable: false, managedAdapter: false, tier: "verified", verified: true, latency_ms: 140, last_verified_at: "2026-08-01T00:00:00.000Z" },
  { name: "Ledger Bank", description: "Discovery-only entry harvested from a public spec.", category: "Finance", baseUrl: "https://api.ledger.example", docsUrl: "", auth: "apiKey", pricing: "paid", callable: false, managedAdapter: false, tier: "auth", verified: false, latency_ms: null, last_verified_at: null },
];

/** Local Next API routes the views call. */
export const local: Record<string, unknown> = {
  "/api/models": { models: [{ id: "openrouter/anthropic/claude-sonnet-4", name: "Claude Sonnet 4", provider: "openrouter" }, { id: "groq/llama-3.3-70b", name: "Llama 3.3 70B", provider: "groq" }] },
  "/api/billing/portal": { url: "#" },
  "/api/workspace/api-keys": { name: "New key", key: "sk-claw-dev-only-example", keyPrefix: "sk-claw-...ple" },
  // Shape from src/app/api/catalog/route.ts GET.
  "/api/catalog": {
    items: catalogItems,
    total: catalogItems.length,
    totalDiscoverable: catalogItems.length,
    page: 1,
    limit: 60,
    hasMore: false,
    categories: { "AI & ML": { total: 2, callable: 1, verified: 0, managedAdapters: 2 }, "Data & Analytics": { total: 1, callable: 0, verified: 1, managedAdapters: 0 }, Finance: { total: 1, callable: 0, verified: 0, managedAdapters: 0 } },
    totalCallable: 1,
    totalCustomerExecutable: 1,
    totalVerified: 1,
    sourceVerifiedCount: 1,
    discoveryOnlyCount: 1,
    managedProviderAdapterCount: 2,
    customerExecutableProviderCount: 1,
    canonGeneratedAt: "2026-08-01T00:00:00.000Z",
  },
};

/** Gateway (GATEWAY_URL) routes the catalog calls. Paths only; the harness matches on origin. */
export const gateway: Record<string, unknown> = {
  // Shape from convex/http.ts POST /api/discover.
  "/api/discover": {
    providers: [
      { providerId: "brave_search", name: "Brave Search", description: "Web search with fresh results and source links.", category: "Data & Analytics", pricing: "freemium", tags: ["search"], customerExecutableActions: ["search"], customerExecutable: true },
      { providerId: "nasa", name: "NASA", description: "Astronomy picture of the day and Mars rover photos.", category: "Science", pricing: "free", tags: ["space"], customerExecutableActions: ["apod", "mars_photos"], customerExecutable: true },
      { providerId: "frankfurter", name: "Frankfurter", description: "Exchange rates from the European Central Bank.", category: "Finance", pricing: "free", tags: ["fx"], customerExecutableActions: ["latest"], customerExecutable: true },
      { providerId: "acme_pending", name: "Acme Pending", description: "Adapter without executable actions; must not be listed.", category: "Utilities", pricing: "free", tags: [], customerExecutableActions: [], customerExecutable: false },
    ],
    total: 4,
  },
  // Shape from convex/http.ts handleManagedExecute success.
  "/v1/execute": {
    success: true,
    provider: "brave_search",
    action: "search",
    data: { web: { results: [
      { title: "APIClaw: agent infrastructure", url: "https://apiclaw.cloud", description: "One gateway for agents." },
      { title: "Managed providers", url: "https://apiclaw.cloud/catalog", description: "Callable now." },
      { title: "Docs", url: "https://apiclaw.cloud/docs", description: "Install and call." },
    ] } },
    _apiclaw: { latencyMs: 212, route: "managed", gateway: true },
  },
};

