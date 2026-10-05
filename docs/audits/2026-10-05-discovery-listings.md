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

## Evidence

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

## Scope and release status

These checks use a freshly seeded active free workspace at the post-signup boundary.
They do not verify a new real Clerk signup or claim a production rollout. The
review step uses the authenticated operator CLI/dashboard, not a new admin UI.
Existing local MCP clients must pass `callable_only:false`; enriched operation and
pricing metadata in the local MCP source requires a future npm release.

Production deployment, npm publication and actual Arcmira publication are separate
from these local results. Follow the guide's backend-first rollout and data-preserving
rollback. The candidate merges remote main through `2f657e1` (OAuth registration fix)
while preserving the deployed workspace-state and website-service repairs in the
local baseline. Post-merge browser, regression, typecheck/codegen and Next build
checks passed. Feature commit: `3af76d0`; merge commit: `a2073b5`. Production state
must still be inspected immediately before any release. Do not overwrite live repairs.
