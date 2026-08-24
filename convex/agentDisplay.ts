/**
 * Shared agent display-name resolution (real names over the workspace,
 * 2026-08-24). Agent cards previously showed random auto-generated names
 * ("Fierce Cipher") because `agents.name` doubled as both the auto-gen
 * placeholder and the user-rename target. That data is untouched here;
 * this module only decides what string a caller should render.
 *
 * Resolution order, used identically by agents:getWorkspaceAgents and
 * workspaces:getConnectedAgents:
 *   1. userSetName: an explicit user rename (agents.name when
 *                    nameSetByUser is true, or agentSessions.customName)
 *   2. prettified mcpClient: "claude-code" -> "Claude Code" etc
 *   3. fallbackName: whatever is stored (may be a legacy random name,
 *                     a fingerprint, or unset)
 *   4. "Unknown agent"
 */

const MCP_CLIENT_LABELS: Record<string, string> = {
  "claude-code": "Claude Code",
  "claude-desktop": "Claude Desktop",
  openclaw: "OpenClaw",
  codex: "Codex",
  cursor: "Cursor",
  windsurf: "Windsurf",
  cline: "Cline",
  continue: "Continue",
  vscode: "VS Code",
};

/** mcpClient values that mean "we could not detect a harness", not a real identity to prettify. */
const UNKNOWN_MCP_CLIENT_VALUES = new Set(["unknown", ""]);

/** Title-case a hyphen/underscore/space separated id, e.g. "some-tool" -> "Some Tool". */
function titleCase(raw: string): string {
  return raw
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * "claude-code" -> "Claude Code". Falls back to title-casing unrecognized
 * mcpClient ids so a new harness never renders as a raw slug. Returns null
 * only when there is no mcpClient to work with.
 */
export function prettifyMcpClient(mcpClient?: string | null): string | null {
  if (!mcpClient) return null;
  const key = mcpClient.trim().toLowerCase();
  if (!key || UNKNOWN_MCP_CLIENT_VALUES.has(key)) return null;
  if (MCP_CLIENT_LABELS[key]) return MCP_CLIENT_LABELS[key];
  return titleCase(key);
}

export function resolveAgentDisplayName(opts: {
  /** An explicit, trusted user rename. Always wins when present. */
  userSetName?: string | null;
  mcpClient?: string | null;
  /** Last-resort: legacy stored name, fingerprint, etc. */
  fallbackName?: string | null;
}): string {
  const userSet = opts.userSetName?.trim();
  if (userSet) return userSet;

  const pretty = prettifyMcpClient(opts.mcpClient);
  if (pretty) return pretty;

  const fallback = opts.fallbackName?.trim();
  if (fallback) return fallback;

  return "Unknown agent";
}
