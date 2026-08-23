import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  InvalidMcpScopeError,
  MCP_TOOL_CAPABILITY,
  filterMcpToolsForScope,
  mcpScopeAllows,
  mcpScopeAllowsTool,
  normalizeRegisteredMcpScope,
  resolveGrantedMcpScope,
} from "./mcp-scope-policy.js";

assert.equal(normalizeRegisteredMcpScope(undefined), "mcp");
assert.equal(normalizeRegisteredMcpScope("mcp:read mcp:call"), "mcp:read mcp:call");
assert.throws(() => normalizeRegisteredMcpScope(""), InvalidMcpScopeError);
assert.throws(() => normalizeRegisteredMcpScope("mcp:read unknown"), InvalidMcpScopeError);

assert.equal(resolveGrantedMcpScope("mcp:read mcp:call", undefined), "mcp:read mcp:call");
assert.equal(resolveGrantedMcpScope("mcp:read mcp:call", "mcp:read"), "mcp:read");
assert.equal(resolveGrantedMcpScope("mcp", "mcp:billing"), "mcp:billing");
assert.throws(
  () => resolveGrantedMcpScope("mcp:read", "mcp:call"),
  /exceeds the client's registered scope/,
);
assert.throws(() => resolveGrantedMcpScope("mcp:read", ""), InvalidMcpScopeError);
assert.throws(() => resolveGrantedMcpScope("mcp:read", "invalid"), InvalidMcpScopeError);

for (const capability of ["read", "call", "billing"] as const) {
  assert.equal(mcpScopeAllows("mcp", capability), true);
  assert.equal(mcpScopeAllows(`mcp:${capability}`, capability), true);
}
assert.equal(mcpScopeAllows("mcp:read", "call"), false);
assert.equal(mcpScopeAllows("mcp:call", "billing"), false);
assert.equal(mcpScopeAllows("mcp:read invalid", "read"), false);
assert.equal(mcpScopeAllows(undefined, "read"), false);

assert.equal(mcpScopeAllowsTool("mcp:read", "discover_apis"), true);
assert.equal(mcpScopeAllowsTool("mcp:read", "call_api"), false);
assert.equal(mcpScopeAllowsTool("mcp:call", "call_api"), true);
assert.equal(mcpScopeAllowsTool("mcp:billing", "check_balance"), true);
assert.equal(mcpScopeAllowsTool("mcp", "start_mission"), true);
assert.equal(mcpScopeAllowsTool("mcp", "unknown_future_tool"), false);

const filtered = filterMcpToolsForScope("mcp:read", [
  { name: "discover_apis" },
  { name: "call_api" },
  { name: "check_balance" },
]);
assert.deepEqual(filtered.map((tool) => tool.name), ["discover_apis"]);

// Every advertised Remote MCP tool must be explicitly classified. New tools
// otherwise remain invisible and denied until their trust boundary is chosen.
const canonicalSource = readFileSync("landing/src/lib/mcp-tools-canon.ts", "utf8");
const toolDeclarations = canonicalSource.slice(0, canonicalSource.indexOf("] as const"));
const advertisedNames = [...toolDeclarations.matchAll(/^\s+name:\s+"([^"]+)",/gm)].map((match) => match[1]);
assert.deepEqual(new Set(Object.keys(MCP_TOOL_CAPABILITY)), new Set(advertisedNames));

// Each listed tool must have one explicit dispatcher branch backed by a real
// local implementation or a live HTTP contract. Placeholder pseudo-APIs are
// intentionally absent from Remote MCP until a persisted backend exists.
const dispatcherSource = canonicalSource.slice(canonicalSource.indexOf("switch (name)"));
const dispatcherCases = [...dispatcherSource.matchAll(/^\s+case "([^"]+)":/gm)];
assert.deepEqual(
  new Set(dispatcherCases.map((match) => match[1])),
  new Set(advertisedNames),
  "advertised Remote MCP tools and dispatcher branches must match exactly",
);

const dispatchContracts: Record<string, RegExp> = {
  apiclaw_help: /CANONICAL_MCP_TOOLS\.map/,
  discover_apis: /callGateway\("\/v1\/discover", "POST"/,
  get_api_details: /callGateway\("\/api\/details", "POST"/,
  list_categories: /callGateway\("\/v1\/discover", "POST"/,
  list_connected: /callGateway\("\/v1\/discover", "POST"/,
  list_models: /\/v1\/models/,
  call_api: /callGateway\("\/v1\/execute", "POST"/,
  check_balance: /callGateway\("\/api\/balance", "POST"/,
  check_workspace_status: /callGateway\("\/api\/balance", "POST"/,
  list_mission_templates: /callGateway\("\/v1\/missions\/templates", "GET"/,
  start_mission: /callGateway\("\/v1\/missions\/start", "POST"/,
  mission_status: /encodeURIComponent\(String\(args\.mission_id\)\)/,
  list_missions: /\/v1\/missions\?limit=/,
  discover_missions: /\/v1\/missions\/discover\?query=/,
};
assert.deepEqual(new Set(Object.keys(dispatchContracts)), new Set(advertisedNames));
for (let index = 0; index < dispatcherCases.length; index++) {
  const current = dispatcherCases[index];
  const next = dispatcherCases[index + 1];
  const block = dispatcherSource.slice(
    current.index!,
    next?.index ?? dispatcherSource.indexOf("default:", current.index!),
  );
  assert.match(block, dispatchContracts[current[1]], `${current[1]} must keep its real dispatcher contract`);
}
for (const brokenTool of ["list_capabilities", "capability", "get_chain_status", "resume_chain"]) {
  assert.equal(advertisedNames.includes(brokenTool), false);
}
assert.doesNotMatch(canonicalSource, /__list__|__chain_status__|__chain_resume__/);

// Homepage design reset (2026-08-23) split page.tsx into landing/src/components/home/*;
// the Remote MCP surface disclosure now lives in Faq.tsx.
const homePage = readFileSync("landing/src/app/page.tsx", "utf8")
  + readFileSync("landing/src/components/home/Faq.tsx", "utf8");
const copiedSurface = homePage.match(/Remote MCP surface \((\d+) tools\): ([^.\n]+)\./);
assert.ok(copiedSurface, "homepage copy must declare the Remote MCP surface");
const copiedNames = copiedSurface[2].split(",").map((name) => name.trim());
assert.equal(Number(copiedSurface[1]), advertisedNames.length);
assert.deepEqual(new Set(copiedNames), new Set(advertisedNames));

const mcpbManifest = JSON.parse(readFileSync("landing/mcpb/manifest.json", "utf8")) as {
  tools?: Array<{ name?: string }>;
};
assert.deepEqual(
  new Set((mcpbManifest.tools ?? []).map((tool) => tool.name)),
  new Set(advertisedNames),
  "published MCP manifest tool names must match the working Remote MCP surface",
);

const wellKnownMcp = readFileSync("landing/src/app/.well-known/mcp/route.ts", "utf8");
assert.match(wellKnownMcp, /statsData\.sourceVerifiedCount\.toLocaleString\(\)/);
assert.match(wellKnownMcp, /CANONICAL_MCP_TOOLS\.map\(\(tool\) => tool\.name\)/);
assert.doesNotMatch(wellKnownMcp, /statsData\.callableCount/);

// Wiring checks keep scope decisions attached to both Remote MCP JSON-RPC and
// direct sk-mcp gateway access. Policy-only tests would miss a bypass here.
const remoteMcpRoute = readFileSync("landing/src/app/mcp/route.ts", "utf8");
assert.match(remoteMcpRoute, /filterMcpToolsForScope\(ctx\.scope, TOOLS\)/);
assert.match(remoteMcpRoute, /mcpScopeAllowsTool\(ctx\.scope, toolName\)/);

const oauthState = readFileSync("convex/mcpOAuth.ts", "utf8");
assert.match(oauthState, /resolveGrantedMcpScope\(client\.scope, args\.scope\)/);
assert.match(oauthState, /scope:\s+grantedScope/);

const gateway = readFileSync("convex/http.ts", "utf8");
assert.match(gateway, /mcpScope:\s+resolved\.scope/);
assert.match(gateway, /requiredMcpCapability:\s+McpCapability\s+=\s+"call"/);
assert.match(gateway, /mcpScopeDenial\(auth,\s+"billing"\)/);
assert.match(gateway, /requireApiKeyAuth\(ctx, request, "read"\)/);
assert.match(gateway, /mcpScopeDenial\(authResult,\s+"call"\)/);

console.log("MCP OAuth scopes are strict, subset-bound, and fail closed per tool capability");
