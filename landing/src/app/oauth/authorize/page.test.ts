import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * A signed-out user hitting /oauth/authorize?... must round-trip through
 * /sign-in with the full original OAuth request intact, then land back on
 * the consent screen showing the client name and requested scopes. Three
 * failure points were possible: (1) middleware.ts dropping the query on the
 * way to /sign-in, (2) /sign-in not telling Clerk's <SignIn/> where to send
 * the user afterward (so the OAuth request is lost even though the URL
 * carried it), (3) the consent screen not actually rendering scope/client
 * info once loaded. Doors cold-test 2026-08-23 caught (2).
 */

const middlewareSource = readFileSync(
  new URL("../../../../middleware.ts", import.meta.url),
  "utf8",
);
const signInSource = readFileSync(
  new URL("../../sign-in/[[...sign-in]]/page.tsx", import.meta.url),
  "utf8",
);
const signUpSource = readFileSync(
  new URL("../../sign-up/[[...sign-up]]/page.tsx", import.meta.url),
  "utf8",
);
const authorizePageSource = readFileSync(
  new URL("./page.tsx", import.meta.url),
  "utf8",
);

// (1) middleware must gate /oauth/authorize and preserve the full path+query
// in redirect_url when bouncing an unauthed request to /sign-in.
assert.match(
  middlewareSource,
  /"\/oauth\/authorize\(\.\*\)"/,
  "middleware.ts must list /oauth/authorize as a protected route",
);
assert.match(
  middlewareSource,
  /signIn\.searchParams\.set\("redirect_url",\s*pathname \+ \(request\.nextUrl\.search \|\| ""\)\)/,
  "middleware.ts must set redirect_url to the full pathname+search, not just the pathname",
);

// (2) /sign-in and /sign-up must read redirect_url off the URL and hand it
// to Clerk explicitly — Clerk's <SignIn/>/<SignUp/> do not consume that
// query param on their own in Core 2, so without this the post-sign-in
// redirect falls back to Clerk's default and the OAuth request is lost.
for (const [name, source] of [
  ["sign-in", signInSource],
  ["sign-up", signUpSource],
] as const) {
  assert.match(
    source,
    /params\.get\("redirect_url"\)/,
    `${name}/page.tsx must read the redirect_url query param`,
  );
  assert.match(
    source,
    /clerkForcedRedirectUrl\(params\.get\("redirect_url"\)\)/,
    `${name}/page.tsx must resolve redirect_url before Clerk mounts`,
  );
  assert.match(
    source,
    /forceRedirectUrl=\{redirectUrl\}/,
    `${name}/page.tsx must force Clerk back to the continuation (CLI /auth/cli or OAuth)`,
  );
  assert.match(
    source,
    /fallbackRedirectUrl=\{redirectUrl\}/,
    `${name}/page.tsx must pass redirect_url through to Clerk as fallbackRedirectUrl`,
  );
  assert.match(
    source,
    /clerkCompanionAuthUrl/,
    `${name}/page.tsx must keep redirect_url when bouncing between sign-in and sign-up`,
  );
}

// (3) The consent screen must actually name the client and describe the
// requested scopes before the user can approve — not just silently mint a
// code for a signed-in user.
assert.match(
  authorizePageSource,
  /Authorize \{client\.name\}\?/,
  "authorize page must show the requesting client's name",
);
assert.match(
  authorizePageSource,
  /SCOPE_DESCRIPTIONS/,
  "authorize page must render human-readable scope descriptions",
);
assert.match(
  authorizePageSource,
  /"mcp:billing":\s*"Read billing usage data\."/,
  "authorize page must describe the sensitive mcp:billing scope",
);
assert.match(
  authorizePageSource,
  /onClick=\{onApprove\}/,
  "authorize page must require an explicit approve action, not an implicit grant",
);

console.log(
  "oauth/authorize: signed-out redirect preserves the full OAuth request through sign-in, and the consent screen names the client + scopes before approval",
);
