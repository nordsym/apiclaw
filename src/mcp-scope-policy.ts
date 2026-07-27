export const MCP_SCOPE_VALUES = [
  "mcp",
  "mcp:read",
  "mcp:call",
  "mcp:billing",
] as const;

export type McpScopeValue = (typeof MCP_SCOPE_VALUES)[number];
export type McpCapability = "read" | "call" | "billing";

const MCP_SCOPE_SET = new Set<string>(MCP_SCOPE_VALUES);

export class InvalidMcpScopeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidMcpScopeError";
  }
}

function strictScopeTokens(value: unknown): McpScopeValue[] | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const tokens = value.trim().split(/\s+/);
  if (tokens.some((token) => !MCP_SCOPE_SET.has(token))) return null;
  const unique = Array.from(new Set(tokens)) as McpScopeValue[];
  return unique.includes("mcp") ? ["mcp"] : unique;
}

function requireScopeTokens(value: unknown, label: string): McpScopeValue[] {
  const tokens = strictScopeTokens(value);
  if (!tokens) {
    throw new InvalidMcpScopeError(`${label} must contain only supported non-empty MCP scopes`);
  }
  return tokens;
}

/**
 * Normalize client registration scope. An omitted registration keeps the
 * backwards-compatible full `mcp` grant, while explicit empty or unknown
 * values are rejected instead of silently escalating to it.
 */
export function normalizeRegisteredMcpScope(value: string | undefined | null): string {
  if (value === undefined || value === null) return "mcp";
  return requireScopeTokens(value, "registered scope").join(" ");
}

/**
 * Resolve the scope placed on an authorization code. Omitted scope inherits
 * the client's registered grant. An explicit request must be a subset of that
 * grant; `mcp` is the backwards-compatible umbrella grant.
 */
export function resolveGrantedMcpScope(
  registeredScope: string,
  requestedScope: string | undefined | null,
): string {
  const registered = requireScopeTokens(registeredScope, "registered scope");
  if (requestedScope === undefined || requestedScope === null) {
    return registered.join(" ");
  }

  const requested = requireScopeTokens(requestedScope, "requested scope");
  const registeredIsFull = registered.includes("mcp");
  if (!registeredIsFull && requested.some((scope) => !registered.includes(scope))) {
    throw new InvalidMcpScopeError("requested scope exceeds the client's registered scope");
  }
  return requested.join(" ");
}

export function mcpScopeAllows(scope: unknown, capability: McpCapability): boolean {
  const tokens = strictScopeTokens(scope);
  if (!tokens) return false;
  return tokens.includes("mcp") || tokens.includes(`mcp:${capability}` as McpScopeValue);
}

export const MCP_TOOL_CAPABILITY = {
  apiclaw_help: "read",
  discover_apis: "read",
  get_api_details: "read",
  list_categories: "read",
  list_connected: "read",
  list_models: "read",
  call_api: "call",
  check_balance: "billing",
  check_workspace_status: "billing",
  list_mission_templates: "read",
  start_mission: "call",
  discover_missions: "read",
  mission_status: "read",
  list_missions: "read",
} as const satisfies Record<string, McpCapability>;

export function requiredMcpCapabilityForTool(toolName: string): McpCapability | null {
  return (MCP_TOOL_CAPABILITY as Record<string, McpCapability>)[toolName] ?? null;
}

export function mcpScopeAllowsTool(scope: unknown, toolName: string): boolean {
  const required = requiredMcpCapabilityForTool(toolName);
  return required !== null && mcpScopeAllows(scope, required);
}

export function filterMcpToolsForScope<T extends { name: string }>(scope: unknown, tools: readonly T[]): T[] {
  return tools.filter((tool) => mcpScopeAllowsTool(scope, tool.name));
}
