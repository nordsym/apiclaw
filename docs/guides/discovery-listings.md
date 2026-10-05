# Workspace discovery listings

A verified workspace can submit an API without registering as a managed provider,
adding a provider key, or setting up payment. This feature adds metadata to
search. It does not connect the API to execution.

## Workspace flow

1. Sign in, then open **Catalog > My APIs > Add API**. The direct link is
   `/workspace?tab=api-catalog&view=my-apis`. This is available to free workspaces.
2. Paste a public HTTPS OpenAPI URL or upload a JSON/YAML specification.
   OpenAPI 3.0/3.1 and Swagger 2.0 are supported. Limits: 1 MB, 200 operations,
   30 import attempts per workspace per UTC hour, 50 saved listings per workspace.
   URL imports require public IPv4 DNS, port 443, HTTP 200, no redirects,
   compression, embedded credentials, query parameters, or fragments. Upload a
   bundled file when the source cannot meet those constraints. External `$ref`
   references and YAML aliases are rejected.
3. Review the imported name, description, base URL, documentation URL,
   authentication and operation summaries. Set the provider's pricing and account
   limits yourself; those are not inferred from the specification. A file may
   require you to fill in documentation or an absolute base URL. Links must use
   HTTPS without credentials, query parameters, or fragments. This is a metadata
   import, not full OpenAPI schema validation or an API health check. No operation
   in the spec is executed.
4. **Save draft**, then **Submit for review**. Drafts and pending submissions stay
   private to that workspace. Check My APIs again for approval or requested changes.
5. After operator approval, search **Catalog > All APIs** or call:

   ```json
   {"query":"Arcmira","callable_only":false}
   ```

   with `discover_apis` in an authenticated MCP connection. Local MCP defaults to
   callable-only search, so explicitly use `false` for discovery listings. HTTP
   clients can POST the same query to `/v1/discover` using their workspace
   credential. No execution credential is required from the listed provider.
6. Edit details or import a new spec from My APIs. The current approved snapshot
   remains visible while changes are reviewed. The listing name stays fixed;
   another identity requires a separate listing. **Unpublish** immediately
   removes the published snapshot from subsequent catalog/discovery requests.
   Search clients may retain already displayed results until they refresh.

Discovery cards include documentation, provider authentication/pricing notes and
operation summaries. They have `callable:false`, `managedAdapter:false`,
`executionAvailable:false`, `verified:false`, and a `listing:` provider ID.
Approval is not a successful execution test or a source-verification badge.
Discovery adds no APIClaw billing, API key custody, provider proxy, per-call
analytics, or execution entitlement. Consumers use the provider's own account
and documentation. Those boundaries apply to Arcmira as to every other listing.

## Operator review

Approval is an internal Convex mutation. There is no browser/admin flag that a
workspace can send to approve itself. An authenticated deployment operator uses
Convex CLI or the dashboard. Work on the intended deployment explicitly:

```sh
npx convex run --prod discoveryListings:pending '{"paginationOpts":{"numItems":50,"cursor":null}}'
```

Follow `continueCursor` until `isDone`. Inspect the listing's workspace in the
Convex dashboard and establish that the workspace owner has the right to
represent the API. Check the public spec/docs, identity and domain relationship,
operation summaries, provider auth and pricing claims. Do not copy secrets from a
specification, execute its operations, add keys, or enable a payment integration.
Reserved execution names and internal-provider references cannot be approved.
Existing discoverable entries with the same name are replaced in search by the
approved metadata; existing callable integrations are never overwritten.

Record evidence in a concise note and approve the exact submitted revision:

```sh
npx convex run --prod discoveryListings:review '{"id":"LISTING_ID","revision":1,"approve":true,"reviewer":"OPERATOR","note":"Ownership and public metadata evidence; discovery only"}'
```

Use `approve:false` with a correction note to request changes. The note is shown
in the submitting workspace, so do not include internal secrets or other
customers' information. A stale revision or non-pending submission is rejected.
An approved name cannot be published by a second workspace. Editing and
unpublishing invalidate outstanding approvals. Operators must not fabricate
ownership evidence or approve an actual provider solely because a test passed.

After approval, verify both `/api/catalog?q=NAME` and authenticated
`/v1/discover` with `callable_only:false`. Confirm the returned listing ID and
all execution flags. Confirm exclusion with `callable_only:true`. Metadata
publication should not create rows in `providers`, `providerAPIs`,
`providerDirectCall`, `providerKeys`, `managedCallLedger`, `purchases` or
`usageRecords`.

## Implementation and release

- `convex/discoveryListings.ts` owns drafts, workspace authorization, versioned
  reviews, approved snapshots, withdrawal and a separate import budget.
- `discoveryListings` is a separate table from the legacy execution registry.
  Its published query exposes only approved metadata, never workspace IDs,
  review notes or drafts.
- `/api/listings/import` authenticates before parsing or downloading. Downloads
  pin a validated public DNS address to the TLS socket and never follow redirects.
- `/api/catalog` merges approved snapshots with the static inventory before
  filtering/counting/pagination. `/v1/discover` reads that same catalog; Remote
  MCP `discover_apis` uses that gateway endpoint. Local MCP also uses the gateway.
- `/v1/execute` and `/v1/call` reject `listing:` IDs before any provider dispatch,
  key lookup or execution charge. No execution registry is populated by approval.
- Catalog responses use `Cache-Control: no-store`. If the published-query backend
  is unavailable, the catalog returns 503 instead of silently omitting listings.

Deploy the additive Convex table/functions before the frontend that reads them.
Reconcile the checkout with current deployed security and website-service policy
before any production push; never overwrite a live repair with a stale checkout.
Then deploy the landing app with `next build` and verify both search surfaces.
The local MCP metadata enrichment ships only with a subsequent npm release;
existing gateway-backed clients can already discover non-callable names when
`callable_only:false` is specified. No npm release is implied by this source change.

Rollback: return the frontend to its prior deployment first. Keep the additive
Convex table and saved data. Disable the new UI by rolling back the frontend;
do not drop the table or remove user submissions to undo a release. Revert the
small execution guards only if independently shown necessary, preserving all
unrelated live auth and billing fixes.

## Runnable verification

```sh
npm ci --ignore-scripts
npm --prefix landing ci --ignore-scripts
npm run test:listings
npx playwright install chromium --only-shell
npm run test:listings-browser
```

The browser harness runs the real React workspace catalog, import/catalog Next
handlers, Convex functions and Remote MCP dispatcher against an isolated
`convex-test` database and fresh bundled headless Chromium. It seeds a new active
free workspace at the post-signup boundary; Clerk signup itself is not mocked
into a claim of live verification. It tests file import, preview, submission,
private operator review, search, callable exclusion, blocked gateway execution,
withdrawal and zero key/payment/execution records. Fixtures are synthetic and
are never written to production. The browser/profile and temporary build are
removed when the run ends.

Optional read-only live spec check:

```sh
LISTING_LIVE_SPEC=1 npm run test:listings-browser
```

This downloads Arcmira's public OpenAPI document through the actual browser
import route and saves only to the isolated test database. It does not register,
approve or publish an actual Arcmira listing, or call an Arcmira API operation.
Unit tests also cover tenant isolation, stale/rejected review, published snapshot
isolation, workspace import budget, malicious specs, DNS pinning and response
bounds. Live release verification is separate from these local checks.

## Live release verification

PR #49 and build fix #50 are deployed. The October 5 production check used a new
free workspace, an owned OpenAPI URL and an uploaded YAML file through preview,
review and both catalog and Remote MCP search. Synthetic entries were withdrawn
after verification. Registration through Clerk CAPTCHA was not automated; the
test identity was provisioned by the operator before the native workspace bridge.
See [the release evidence](../audits/2026-10-05-discovery-listings.md) for precise
limits and before/after billing checks. The owned URL fixture at
`/testing/discovery-openapi.json` describes no executable service. Real provider
publication still requires ownership and content approval.

Observed release behavior: pushes to main automatically start Vercel production
builds; branch previews were canceled before building. Deploy backend changes
before merging a frontend dependency on them, or explicitly coordinate the Git
release. Do not assume this project is manual-deploy-only.
