#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { getBrowserSessionRefreshDelay } from "./workspace-session";
import { safeAuthContinuation } from "./auth-continuation";

const now = Date.UTC(2026, 6, 19, 12);
assert.equal(getBrowserSessionRefreshDelay(now + 15 * 60_000, now), 13 * 60_000);
assert.equal(getBrowserSessionRefreshDelay(now + 1_500, now), 1_000);
assert.equal(safeAuthContinuation("/auth/cli?authId=abc123"), "/auth/cli?authId=abc123");
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

for (const page of [
  "../app/workspace/page.tsx",
  "../app/workspace/chains/page.tsx",
  "../app/workspace/integrations/page.tsx",
]) {
  const source = readFileSync(fileURLToPath(new URL(page, import.meta.url)), "utf8");
  assert.match(
    source,
    /subscribeWorkspaceSessionToken/,
    `${page} must replace its in-memory token when the browser child rotates`,
  );
}

console.log("browser bootstrap returns only rotating child tokens and refreshes before expiry");
