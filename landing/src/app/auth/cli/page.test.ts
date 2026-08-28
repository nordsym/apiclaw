import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * /auth/cli claims a pending CLI login into the signed-in Clerk user's
 * workspace. It must never do that on a bare GET — a signed-in browser
 * navigated here by a hostile page (?authId=<attacker id>) must not
 * silently hand over a session. The claim can only run from inside the
 * "use server" action the Authorize button submits.
 */

const pageSource = readFileSync(
  new URL("./page.tsx", import.meta.url),
  "utf8",
);
const actionsSource = readFileSync(
  new URL("./actions.ts", import.meta.url),
  "utf8",
);

// The page (server component, runs on every GET) must not call claimAuthId
// itself — that logic now lives only in actions.ts.
assert.doesNotMatch(
  pageSource,
  /claimAuthId\(/,
  "page.tsx must not call claimAuthId on render; the claim belongs to the server action",
);

// actions.ts must be a server action module and must be the one calling
// claimAuthId.
assert.match(
  actionsSource,
  /^"use server";/m,
  "actions.ts must be a \"use server\" module",
);
assert.match(
  actionsSource,
  /claimAuthId\(/,
  "actions.ts must call claimAuthId",
);
assert.match(
  actionsSource,
  /cliAuth:claim/,
  "actions.ts must be the one talking to Convex cliAuth:claim",
);

// The confirmation view must require an explicit form submission (POST) to
// authorize, not render-time redirect logic.
assert.match(
  pageSource,
  /<form action=\{authorizeCli\} method="post"/,
  "page.tsx must render a POST form to authorize the CLI session",
);
assert.match(
  pageSource,
  /Clerk sign-in is not done/,
  "page.tsx must say Clerk sign-in is not enough without Authorize",
);
assert.match(
  pageSource,
  /Authorize or the terminal stays unsigned/,
  "page.tsx must tell the user the CLI is still waiting",
);
assert.match(
  pageSource,
  /npx @nordsym\/apiclaw auth whoami/,
  "page.tsx must point at whoami after Authorize",
);
assert.doesNotMatch(
  pageSource,
  /One click and you are back/,
  "page.tsx must not claim one-click success before Authorize",
);
assert.match(
  pageSource,
  /signInHref=\{signInHref\}/,
  "unsigned CLI page must keep header Sign in on the authId continuation",
);
assert.match(
  pageSource,
  /signInHref=\{null\}/,
  "signed-in CLI page must hide header Sign in so Authorize is the only next step",
);

// Identity used by the action must come from the server session, not the
// submitted form fields.
assert.doesNotMatch(
  actionsSource,
  /formData\.get\(["'](?:clerkUserId|email)["']\)/,
  "actions.ts must not trust identity fields from the form",
);
assert.match(
  actionsSource,
  /await auth\(\)/,
  "actions.ts must re-resolve the Clerk session server-side",
);

console.log("auth/cli: claim only runs from the \"use server\" Authorize action, never on GET");
