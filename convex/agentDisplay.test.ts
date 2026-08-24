#!/usr/bin/env npx tsx
/**
 * Agent display-name resolution (real names over the workspace, 2026-08-24).
 * Guards the precedence: user rename > prettified mcpClient > stored
 * fallback > "Unknown agent", and that unrecognized mcpClient ids get
 * title-cased instead of rendering as a raw slug.
 */
import assert from "node:assert/strict";
import { prettifyMcpClient, resolveAgentDisplayName } from "./agentDisplay";

// prettifyMcpClient: known ids
assert.equal(prettifyMcpClient("claude-code"), "Claude Code");
assert.equal(prettifyMcpClient("openclaw"), "OpenClaw");
assert.equal(prettifyMcpClient("codex"), "Codex");
assert.equal(prettifyMcpClient("claude-desktop"), "Claude Desktop");

// prettifyMcpClient: unknown id falls back to title-case, never a raw slug
assert.equal(prettifyMcpClient("some-new-harness"), "Some New Harness");
assert.equal(prettifyMcpClient(undefined), null);
assert.equal(prettifyMcpClient(null), null);
assert.equal(prettifyMcpClient(""), null);

// prettifyMcpClient: "unknown" means no harness was detected, not a real
// identity to prettify (fixes the "Unknown client" regression on old rows)
assert.equal(prettifyMcpClient("unknown"), null);
assert.equal(
  resolveAgentDisplayName({ userSetName: null, mcpClient: "unknown", fallbackName: "Fierce Cipher" }),
  "Fierce Cipher"
);

// resolveAgentDisplayName: user rename always wins, even over a known mcpClient
assert.equal(
  resolveAgentDisplayName({ userSetName: "Gustav's Mac", mcpClient: "claude-code", fallbackName: "Fierce Cipher" }),
  "Gustav's Mac"
);

// No user rename: prettified mcpClient wins over a stored random name
assert.equal(
  resolveAgentDisplayName({ userSetName: null, mcpClient: "claude-code", fallbackName: "Fierce Cipher" }),
  "Claude Code"
);
assert.equal(
  resolveAgentDisplayName({ userSetName: undefined, mcpClient: "openclaw", fallbackName: "Frost Hawk" }),
  "OpenClaw"
);

// No mcpClient: falls back to the stored name
assert.equal(
  resolveAgentDisplayName({ userSetName: null, mcpClient: null, fallbackName: "Frost Hawk" }),
  "Frost Hawk"
);

// Nothing at all: last-resort literal
assert.equal(resolveAgentDisplayName({ userSetName: null, mcpClient: null, fallbackName: null }), "Unknown agent");

// Blank strings behave like absent
assert.equal(
  resolveAgentDisplayName({ userSetName: "   ", mcpClient: "codex", fallbackName: "x" }),
  "Codex"
);

console.log("agentDisplay.test.ts: OK");
