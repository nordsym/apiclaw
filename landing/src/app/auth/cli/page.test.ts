import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { claimErrorMessage } from "./shared";

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

// The page (server component, runs on every GET) must not claim.
// Existing sessions POST authorizeCli. Fresh Clerk claims in clerk-bridge.
assert.doesNotMatch(
  pageSource,
  /claimCliAuthId\(|claimAuthId\(/,
  "page.tsx must not claim on render; the claim belongs to the server action or clerk-bridge",
);

assert.match(
  actionsSource,
  /^"use server";/m,
  "actions.ts must be a \"use server\" module",
);
assert.match(
  actionsSource,
  /claimCliAuthId\(/,
  "actions.ts must call claimCliAuthId",
);
assert.match(
  actionsSource,
  /cliAuthDonePath\(/,
  "Authorize must land on the done page, not only raw localhost",
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
  /Authorize this agent/,
  "page.tsx must make Authorize the one labeled action",
);
assert.match(
  pageSource,
  /Authorize with Google or email/,
  "unsigned CLI page must treat sign-in as the Authorize consent",
);
assert.match(
  pageSource,
  /does not ask for a second click/,
  "unsigned copy must not promise a second Authorize screen after sign-in",
);
assert.match(
  pageSource,
  /Click Authorize to connect that agent to your workspace/,
  "already-signed-in page must still require the Authorize button",
);
assert.match(
  pageSource,
  /Signing in to APIClaw with Google or email on this page is the authorization/,
  "unsigned copy must tell a human that sign-in and Authorize are one action",
);
assert.match(
  pageSource,
  /go back to that same chat/,
  "unsigned copy must send the human back to the agent, not a terminal",
);
assert.match(pageSource, /Claude/);
assert.match(pageSource, /Codex/);
assert.match(pageSource, /Cursor/);
assert.match(pageSource, /Grok/);
const pageWithoutComments = pageSource.replace(/\/\*[\s\S]*?\*\//g, "");
assert.doesNotMatch(
  pageWithoutComments,
  /completing Clerk|After Clerk|Clerk sign-in on other pages|session_token|No email on Clerk/,
  "Authorize copy must not lean on Clerk or session_token jargon",
);
assert.doesNotMatch(pageWithoutComments, /—|–/, "no em dashes in user-facing copy");
assert.doesNotMatch(
  pageWithoutComments,
  /Authorize this terminal|waiting terminal|Keep the terminal|A terminal on your machine/,
  "auth/cli copy must not sound like a waiting terminal",
);
assert.match(
  pageSource,
  /Your agent confirms and makes the first call/,
  "page.tsx must say the agent continues after Authorize",
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

assert.match(claimErrorMessage("expired"), /Ask your agent to show a fresh login URL/);
assert.match(claimErrorMessage("already_used"), /Ask your agent to show a fresh login URL/);
assert.match(claimErrorMessage("auth_id_not_found"), /Ask your agent to show a fresh login URL/);
assert.match(claimErrorMessage("no_email"), /Sign in again with Google or email/);
for (const code of ["expired", "already_used", "auth_id_not_found", "no_email"] as const) {
  assert.doesNotMatch(claimErrorMessage(code), /Clerk|session_token|Run the login command|terminal/i);
}

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
