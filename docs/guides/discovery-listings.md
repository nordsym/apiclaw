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

A workspace can submit at most 10 revisions per UTC hour, independently of import
and execution quotas. Repeating an already-pending submission creates no new notification.
On submission, APIClaw schedules an alert to the existing APIClaw Telegram ALERTS
channel through Inbound Net and an email to `gustav@nordsym.com` from
`noreply@apiclaw.cloud`. Both link to the exact listing in
`https://apiclaw.cloud/workspace/review-listings?listing=LISTING_ID`.

1. Sign in with the verified `gustav@nordsym.com` Clerk identity. Other workspace
   users cannot read the queue or approve submissions.
2. Check the submitter, imported metadata and operations. Verify the submitter's
   right to represent the API using independent ownership evidence.
3. Enter a review note. It is shown to the submitting workspace, so do not include
   internal secrets or other customers' data.
4. Choose **Approve discovery listing** or **Request changes**. The decision applies
   only to the revision shown. Stale decisions fail and require a fresh review.
   Rejected submissions must be edited before resubmission.
5. After approval, verify the catalog and `discover_apis` with `callable_only:false`.
   The submitter sees status and your note in My APIs. No decision email to the
   submitter is implied.

The full pending queue is available at `/workspace/review-listings`, including
notification status (`queued`, `sent`, `failed`, or not recorded for older entries).
For new submissions after the alert-delivery release, `sent` means Telegram
sendMessage completed through Inbound Net and the email provider accepted the
message. This is not proof of reading or Gmail inbox placement. Live tests found
the email in Gmail spam despite SPF, DKIM and DMARC passing; use Telegram or the
review queue as the operational path. Older `sent` records are email-only.
Failed attempts retry after one and two minutes, with three attempts maximum.
A stable email idempotency key prevents duplicate email sends for the same revision.
Completed channels are skipped on retry. An ambiguous Telegram timeout can produce
a duplicate alert; approval still requires the current revision and operator login.
Approval, editing and withdrawal stop queued retries for an obsolete submission.
If all attempts fail, the pending item remains reviewable in the queue; check the
mail service and Inbound Net configuration before resubmitting a revised draft.
Previously pending entries are not automatically backfilled on deployment.

The server bridge verifies Clerk operator identity and supplies the internal secret
server-side. The browser never receives that secret, and a workspace session alone
cannot approve itself. Mutating HTTP requests require same-origin validation.
The internal CLI remains available to authenticated deployment operators:

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
