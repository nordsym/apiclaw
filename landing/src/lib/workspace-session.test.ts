#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { getBrowserSessionRefreshDelay } from "./workspace-session";
import { clerkCompanionAuthUrl, clerkForcedRedirectUrl, safeAuthContinuation } from "./auth-continuation";

const now = Date.UTC(2026, 6, 19, 12);
assert.equal(getBrowserSessionRefreshDelay(now + 15 * 60_000, now), 13 * 60_000);
assert.equal(getBrowserSessionRefreshDelay(now + 1_500, now), 1_000);
assert.equal(safeAuthContinuation("/auth/cli?authId=abc123"), "/auth/cli?authId=abc123");
assert.equal(
  clerkForcedRedirectUrl("/auth/cli?authId=abc123"),
  "/api/workspace-auth/clerk-bridge?next=%2Fauth%2Fcli%3FauthId%3Dabc123",
);
assert.equal(clerkForcedRedirectUrl(null), "/api/workspace-auth/clerk-bridge");
assert.equal(clerkForcedRedirectUrl("https://attacker.invalid"), "/api/workspace-auth/clerk-bridge");
assert.equal(
  clerkCompanionAuthUrl("/sign-up", "/auth/cli?authId=abc123"),
  "/sign-up?redirect_url=%2Fauth%2Fcli%3FauthId%3Dabc123",
);
assert.equal(clerkCompanionAuthUrl("/sign-in", null), "/sign-in");
assert.equal(
  clerkCompanionAuthUrl("/sign-up", "/api/workspace-auth/clerk-bridge?next=%2Fauth%2Fcli"),
  "/sign-up",
);
assert.equal(safeAuthContinuation(undefined, "/sign-in"), "/sign-in");
assert.equal(safeAuthContinuation("https://attacker.invalid", "/sign-in"), "/sign-in");
assert.equal(
  safeAuthContinuation("/oauth/authorize?client_id=test&redirect_uri=https%3A%2F%2Fclient.example"),
  "/oauth/authorize?client_id=test&redirect_uri=https%3A%2F%2Fclient.example",
);
for (const unsafe of [
  "https://attacker.invalid",
  "//attacker.invalid",
  "/%2f%2fattacker.invalid",
  "/\\attacker.invalid",
  "/catalog",
]) {
  assert.equal(safeAuthContinuation(unsafe), "/workspace");
}

const routePath = fileURLToPath(new URL("../app/api/workspace-auth/session/route.ts", import.meta.url));
const route = readFileSync(routePath, "utf8");
assert.match(route, /path: "workspaces:mintBrowserSession"/);
assert.match(route, /browserToken: result\.browserToken/);
assert.doesNotMatch(route, /workspaceToken:\s*(token|ownerToken)/);
assert.doesNotMatch(route, /browserToken:\s*ownerToken/);
assert.doesNotMatch(route, /const token = cookieToken \|\| headerToken/);
assert.match(
  route,
  /if \(!logoutResponse\.ok \|\| result\?\.success !== true\)[\s\S]*?return noStoreJson\(\{ success: false \}, \{ status: 503 \}\);[\s\S]*?response\.cookies\.delete\(OWNER_COOKIE\)/,
  "failed Convex revocation must return before the owner cookie is cleared",
);
const logoutCatch = route.match(/export async function DELETE[\s\S]*?catch \(error\) \{([\s\S]*?)\n  \}\n\}/)?.[1] ?? "";
assert.doesNotMatch(
  logoutCatch,
  /cookies\.delete/,
  "network failures preserve the owner cookie so revocation can be retried",
);

const workspacePage = readFileSync(
  fileURLToPath(new URL("../app/workspace/page.tsx", import.meta.url)),
  "utf8",
);

const layout = readFileSync(
  fileURLToPath(new URL("../app/layout.tsx", import.meta.url)),
  "utf8",
);
assert.doesNotMatch(layout, /ForceRedirectUrl/);
assert.match(layout, /signInFallbackRedirectUrl/);
assert.match(layout, /signUpFallbackRedirectUrl/);
assert.match(
  workspacePage,
  /const logoutResponse = await fetch[\s\S]*?if \(!logoutResponse\.ok\)[\s\S]*?throw new Error\("APIClaw session revocation failed"\)/,
  "Clerk sign-out must not continue after failed APIClaw revocation",
);

// Session-owning workspace routes. /workspace/integrations was retired
// (2026-08-24): it now redirects to /workspace?tab=agents. Connector UI
// lives in views/Agents.tsx, which receives the token from page.tsx.
for (const page of [
  "../app/workspace/page.tsx",
  "../app/workspace/chains/page.tsx",
]) {
  const source = readFileSync(fileURLToPath(new URL(page, import.meta.url)), "utf8");
  assert.match(
    source,
    /subscribeWorkspaceSessionToken/,
    `${page} must replace its in-memory token when the browser child rotates`,
  );
}

const integrationsRedirect = readFileSync(
  fileURLToPath(new URL("../app/workspace/integrations/page.tsx", import.meta.url)),
  "utf8",
);
assert.match(
  integrationsRedirect,
  /router\.replace\("\/workspace\?tab=agents"\)/,
  "retired /workspace/integrations must redirect to Agents, not own session calls",
);
assert.doesNotMatch(
  integrationsRedirect,
  /subscribeWorkspaceSessionToken/,
  "retired /workspace/integrations must not own a browser session subscription",
);

console.log("browser bootstrap returns only rotating child tokens and refreshes before expiry");
