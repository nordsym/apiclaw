# Workspace discovery onboarding verification

Up: [Discovery listing guide](../guides/discovery-listings.md)

## Change

A free, active workspace can import an OpenAPI URL or file from Catalog > My APIs,
preview metadata, save a private draft and submit it. A deployment operator reviews
an exact revision. Only the approved snapshot enters the shared catalog and
`discover_apis`. Rejected updates preserve the old approved snapshot; unpublish
removes it. A dedicated table prevents discovery submissions from becoming legacy
provider execution records.

The public instructions previously pointed at a missing workspace navigation item
and promised immediate discovery, generated capability tags and per-call analytics.
The docs now describe the actual import/review/search path and the explicit
`callable_only:false` discovery request.

## Local evidence before release

- `npm run test:listings`: passed. Tests cover active session authorization,
  cross-workspace denial, import budget, reserved execution names, pending/rejected
  visibility, revision checks, approved-snapshot isolation, withdrawal, catalog
  merge and zero provider/key/payment/execution records. Parser/fetch tests reject
  external references, aliases, oversized specs, private/mixed DNS and redirects;
  a runnable mock socket verifies DNS pinning.
- Browser test: real React components, Next import/catalog handlers, Convex-test
  database, gateway HTTP handlers and Remote MCP `discover_apis` dispatcher.
  File import, preview, save, submit, approve, catalog search and discovery passed.
  Callable-only search excluded the listing. Both execution routes returned 403
  `discovery_only`. Withdrawal removed discovery visibility. There were no browser
  JavaScript errors and no provider/key/payment/execution records.
- Read-only URL import: `https://api.arcmira.com/v1/openapi.json` returned 258143
  bytes. The parser identified `Arcmira API`, 36 operations, HTTP bearer auth,
  `https://api.arcmira.com/` and `https://arcmira.com/docs`. The browser also imported
  that public URL through the real import route and saved to the isolated database.
  No Arcmira API operation was executed and no real listing was submitted/approved.
- Full `npm test` passed after merging current main, including the OAuth
  registration and first-call nudge regressions plus the new listing tests.
- Root and Convex TypeScript checks passed. Next production build passed; existing
  Browserslist and edge-rendering warnings remained. Generated timestamp-only
  statistics changes from the prebuild were restored.
- Convex code generation passed. This command does not release the functions.

## Production release, 2026-10-05

Gustav explicitly authorized PR #49 merge, production deployment and synthetic live
verification. Real Arcmira publication remains prohibited without their approval.
PR #49 merged as `656cbf58fb9ab6469e06abc656a8db3720be1e2f`.

Before deployment, the deployed Convex `apiKeys.js` and `http.js` hashes matched
the recorded October 2 website-service repair. The candidate was reconciled with
current main and the live modules. Convex deployment dry-run and typecheck passed,
with no deleted indexes. A private rollback bundle was retained. The additive
backend was deployed first to `adventurous-avocet-799`.

The main-branch Git integration **does automatically deploy production**. This
contradicts older manual-only release notes. Branch previews remain automatically
canceled before build, so their failing Vercel status is not a code/build result.
The first production build failed because a frontend type import reached
`convex/values`, absent when only landing dependencies are installed. Old frontend
aliases remained serving while the fix was prepared.

PR #50 moved shared metadata to a dependency-free type module and added an owned,
explicitly synthetic OpenAPI fixture. Listing tests, Convex typecheck, isolated
browser workflow and landing typecheck passed. The landing check was also run in
a fresh archive with only `landing/node_modules`, reproducing the dependency
boundary that the earlier local build had missed. The current root-wide typecheck
reports errors in `src/first-call-nudge.test.ts` and `src/oauth-dcr.test.ts`; it is
not claimed green for this release. Those test files were unchanged by PR #50.

PR #50 merged as `abfec7d4a49eb4a0a495c6563d7eef347aca17ff`.
Vercel production build passed. `dpl_8ghtXaniALKbo1CjJACLD1VzDYSe` is READY;
`apiclaw.cloud` and `api.apiclaw.cloud` aliases were read back on that deployment.
The backend still corresponds to PR #49; PR #50 changes only erased types and
frontend/static content, requiring no additional backend deployment.

## Live end-to-end evidence

The isolated bundled headless Chromium encountered Clerk's human verification.
No CAPTCHA was bypassed or disabled. An operator-created, verified test identity
signed in through Clerk, and the native Clerk bridge created a new active free
workspace. Thus the live post-auth workspace flow is verified; self-registration
through CAPTCHA is not. No existing customer workspace was used.

Two synthetic, NordSym-owned listings were created through the production UI:

- URL: `https://apiclaw.cloud/testing/discovery-openapi.json`, OpenAPI 3.1 JSON.
- File: an uploaded OpenAPI 3.0.3 YAML file, one explicitly non-existent operation.

Both paths passed preview, save draft and submit. Pending entries returned zero
results in both catalog and authenticated Remote MCP `discover_apis`. The operator
approved exact revision 1 for only these two synthetic rows. Both appeared in
the browser catalog and returned two matching results in the public catalog and
actual `/mcp` tool call. The MCP token had `mcp:read` scope only. Both search
surfaces returned zero results with the callable-only filter. Returned metadata
had `callable:false`, `managedAdapter:false`, `executionAvailable:false`,
`verified:false` and matching `listing:` IDs. Catalog returned `no-store`.

Using the test workspace's owner session, `/v1/execute` and `/v1/call` each returned
403 `discovery_only` for each listing. No listed operation was dispatched.
After these probes, the operator withdrew both fixtures through the UI. They
became private revision-2 drafts; both search surfaces again returned zero results.
No test listing remains public. The workspace and private drafts are retained for
recovery and audit, not deleted. The isolated browser reported no page errors.

Before import, native onboarding had already recorded one successful NASA/APOD
activation call with provider cost 0. Workspace usage and managed ledger count
stayed at 1 throughout the listing test. Counts of `providers`, `providerAPIs`,
`providerDirectCall`, `providerKeys`, workspace purchases and `usageRecords`
remained 0. No card, Stripe customer or subscription was attached. These are
before/after checks, not a claim that signup itself performs no execution.

Arcmira's real public OpenAPI URL was additionally imported into the live preview:
`Arcmira API`, 36 operations, `https://api.arcmira.com/`. The preview was canceled
without saving, submitting or approving it. No Arcmira operation or provider
credential was used. Authenticated Arcmira discovery returned zero results.

Unauthenticated OAuth registration and gateway execution remained blocked with
401. The test MCP connector was revoked after verification, and browser sessions
were closed. No npm publication was performed. Existing gateway-backed clients
can find approved names with `callable_only:false`; local MCP metadata enrichment
still requires a later package release.

Machine-readable, credential-free evidence:
[Live verification results](2026-10-05-discovery-live-evidence.json).
The live workflow guide is [Workspace discovery listings](../guides/discovery-listings.md).
