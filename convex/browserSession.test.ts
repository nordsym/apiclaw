#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  BROWSER_SESSION_TTL_MS,
  canMintBrowserSession,
  isBrowserSession,
  isSessionExpired,
  isSessionUsable,
  shouldDeleteBrowserSession,
} from "./sessionSecurity";

const now = Date.UTC(2026, 6, 19, 12);
const legacyOwner = { sessionToken: "owner-legacy" };
const explicitOwner = { sessionToken: "owner", sessionKind: "owner" as const };
const browser = {
  sessionToken: "browser-current",
  sessionKind: "browser" as const,
  parentSessionId: "parent-id",
  expiresAt: now + BROWSER_SESSION_TTL_MS,
};

assert.equal(BROWSER_SESSION_TTL_MS, 15 * 60 * 1000);
assert.equal(canMintBrowserSession(legacyOwner, now), true, "legacy durable sessions remain owner sessions");
assert.equal(canMintBrowserSession(explicitOwner, now), true);
assert.equal(canMintBrowserSession(browser, now), false, "browser children cannot mint descendants");
assert.equal(isBrowserSession({ sessionToken: "malformed", parentSessionId: "parent-id" }), true);
assert.equal(
  isSessionUsable({ sessionToken: "malformed", sessionKind: "browser" }, now),
  false,
  "browser sessions without an explicit parent and expiry fail closed",
);
assert.equal(isSessionExpired(browser, now), false);
assert.equal(isSessionExpired(browser, browser.expiresAt), true);
assert.equal(canMintBrowserSession({ ...explicitOwner, expiresAt: now }, now), false);

assert.equal(
  shouldDeleteBrowserSession(browser, browser.sessionToken, browser.expiresAt),
  true,
  "the exact expired child is deleted",
);
assert.equal(
  shouldDeleteBrowserSession(browser, "stale-scheduled-token", browser.expiresAt),
  false,
  "a stale cleanup job cannot delete a rotated token",
);
assert.equal(
  shouldDeleteBrowserSession(browser, browser.sessionToken, browser.expiresAt - 1),
  false,
  "cleanup never runs before the explicit expiry",
);
assert.equal(
  shouldDeleteBrowserSession(explicitOwner, explicitOwner.sessionToken, now + BROWSER_SESSION_TTL_MS),
  false,
  "scheduled cleanup cannot delete an owner session",
);

const workspacesSource = readFileSync(
  fileURLToPath(new URL("./workspaces.ts", import.meta.url)),
  "utf8",
);
assert.match(
  workspacesSource,
  /export const logout = mutation\([\s\S]*?by_parentSessionId[\s\S]*?await ctx\.db\.delete\(child\._id\)[\s\S]*?await ctx\.db\.delete\(session\._id\)/,
  "confirmed logout deletes every browser child before deleting its durable owner",
);

console.log("browser sessions are owner-bound, short-lived, and cleanup is token-safe");
