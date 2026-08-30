#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  CLI_CLERK_INTENT_COOKIE,
  cliAuthClaimErrorPath,
  cliAuthDonePath,
  cliAuthIdFromPath,
  shouldCollapseClerkConsent,
} from "./claim";

const AUTH_ID = "waittestwaittestwaittestwait12";

assert.equal(CLI_CLERK_INTENT_COOKIE, "apiclaw_cli_clerk_intent");

assert.equal(cliAuthIdFromPath(`/auth/cli?authId=${AUTH_ID}`), AUTH_ID);
assert.equal(cliAuthIdFromPath(`/auth/cli?authId=${AUTH_ID}&error=expired`), AUTH_ID);
assert.equal(cliAuthIdFromPath("/auth/cli"), undefined);
assert.equal(cliAuthIdFromPath("/auth/cli?authId=short"), undefined);
assert.equal(cliAuthIdFromPath("/workspace"), undefined);
assert.equal(cliAuthIdFromPath("/sign-in?redirect_url=%2Fauth%2Fcli"), undefined);
assert.equal(cliAuthIdFromPath(undefined), undefined);

assert.equal(
  shouldCollapseClerkConsent(AUTH_ID, AUTH_ID),
  true,
  "fresh Clerk that started on this authId collapses into Authorize",
);
assert.equal(
  shouldCollapseClerkConsent(AUTH_ID, undefined),
  false,
  "existing Clerk session / missing intent must not skip the Authorize button",
);
assert.equal(
  shouldCollapseClerkConsent(AUTH_ID, "otherotherotherotherotheroth12"),
  false,
  "mismatched intent cookie must not claim a different authId",
);
assert.equal(shouldCollapseClerkConsent(undefined, AUTH_ID), false);
assert.equal(shouldCollapseClerkConsent("short", "short"), false);

assert.equal(
  cliAuthDonePath({ authId: AUTH_ID, port: 41789, code: "one-time-code", state: "csrf-state" }),
  `/auth/cli/done?authId=${AUTH_ID}&port=41789&code=one-time-code&state=csrf-state`,
);
assert.equal(
  cliAuthClaimErrorPath(AUTH_ID, "expired"),
  `/auth/cli?authId=${AUTH_ID}&error=expired`,
);

const claimSource = readFileSync(new URL("./claim.ts", import.meta.url), "utf8");
assert.match(claimSource, /cliAuth:claim/);
assert.match(claimSource, /APICLAW_INTERNAL_SECRET/);
assert.doesNotMatch(
  claimSource,
  /formData/,
  "shared claim must not read identity from a form",
);

const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
assert.doesNotMatch(
  pageSource,
  /claimCliAuthId\(|shouldCollapseClerkConsent\(/,
  "GET /auth/cli must not claim; clerk-bridge and the Authorize POST do",
);

const actionsSource = readFileSync(new URL("./actions.ts", import.meta.url), "utf8");
assert.match(actionsSource, /claimCliAuthId\(/);
assert.match(actionsSource, /cliAuthDonePath\(/);

const clerkBridge = readFileSync(
  fileURLToPath(new URL("../../api/workspace-auth/clerk-bridge/route.ts", import.meta.url)),
  "utf8",
);
assert.match(clerkBridge, /shouldCollapseClerkConsent/);
assert.match(clerkBridge, /claimCliAuthId/);
assert.match(clerkBridge, /cliAuthDonePath/);
assert.match(clerkBridge, /CLI_CLERK_INTENT_COOKIE/);
assert.match(
  clerkBridge,
  /Authorize button/,
  "clerk-bridge must keep the Authorize fallback when intent is missing",
);

const middleware = readFileSync(
  fileURLToPath(new URL("../../../../middleware.ts", import.meta.url)),
  "utf8",
);
assert.match(middleware, /apiclaw_cli_clerk_intent/);
assert.match(
  middleware,
  /const \{ userId \} = await auth\(\);[\s\S]*if \(!userId\) \{[\s\S]*apiclaw_cli_clerk_intent/,
  "clerk-intent cookie is only set for an unsigned /auth/cli visit",
);

console.log("auth/cli claim: fresh Clerk collapses into Authorize; GET and existing sessions do not");
