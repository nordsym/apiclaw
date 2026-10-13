# Agent-driven discovery listing review

Scope: founder-authorized listing decisions through a bearer HTTP API, CLI and the
existing founder browser UI. Approval remains discovery metadata only.

## Reproduction and root cause

The prior React queue disabled both decision buttons while the review note was blank.
An isolated bundled Chromium preview with a pending Convex fixture reproduced the
disabled button and absence of an error. This prevented a click from submitting any
request. Filling the note allowed the same existing decision flow to succeed.
The original human session's console/network trace was not retained, so this does
not infer a CSRF or Clerk failure during that historical attempt.

The hosted Vercel preview additionally encountered Clerk's origin restriction:
production Clerk keys reject a vercel.app preview origin. No Clerk origin policy
or deployment protection was weakened. Browser component, real HTTP-route and
Convex tests ran in the isolated preview harness; authenticated founder testing
on the production host is a separate release gate.

The fixed UI accepts the click, explains that a note is required, focuses the
textarea, and bounds requests with a timeout. Server errors, stale revisions and
invalid response bodies produce visible errors. Isolated Chromium also verified
that a failed POST leaves the item pending and shows the server's error.

## Operator boundary

Only the two exact `/api/internal/listings/pending` and `/review` routes bypass
Clerk middleware. They independently authenticate the dedicated operator token
using Node's constant-time comparison of SHA-256 digests. Neither a workspace
session nor a Clerk cookie authenticates these routes. Missing/wrong token is 401.
The token is never included in browser code, responses, audit rows or notifications.

Both routes consume a durable Convex budget, shared across Vercel instances and
agent names: 120 requests per UTC hour. Excess returns 429 with Retry-After.
Authenticated attribution comes from the token holder's X-APIClaw-Agent header;
it is a bounded label, not a cryptographically independent agent identity.

Both UI and agent decisions call the existing policy helper. Revision changes
return 409. The decision and append-only audit row commit atomically. The row stores
listing, workspace, revision, reviewer, decision, note and timestamp. Failed attempts
create no decision row. Audit history begins at this release; prior last-review
fields are not fabricated into a historical ledger.

The CLI supports pending, approve and reject, reads the token from its environment,
fetches the selected pending revision and can require the notification's revision.
It refuses insecure remote HTTP and credential-bearing redirects. No provider
operation, key storage or billing path is invoked. Rejection of a revised draft
preserves an earlier approved snapshot, matching existing behavior.

Email and Telegram carry literal listing ID and revision. The existing authenticated
Inbound Net Telegram template was updated without changing other events. Its active
workflow version is `51451166-b245-403a-9c72-e3f720638ac3`.

## Validation

Local checks: full npm suite, root/Convex/landing typechecks, package build, landing
build and isolated Chromium workflow passed. Two existing test-only type errors
were corrected to make the package build and CI gate usable: a generic fixture
annotation and an explicit NodeNext import extension. PR CI also installs landing
dependencies required by the existing route tests. npm 2.9.12 is the CLI release;
the desktop MCP bundle version is unchanged.

The operator tests execute the actual Next routes against convex-test, covering
missing/wrong tokens, invalid agent labels, exact revisions, approval/rejection,
private pending projection, publication, atomic audit and shared rate limit.
They verify zero provider/key/payment/execution records and unchanged usage.

Release verification and deployment identifiers are recorded after the live gate.
Operator procedure: [approve listings](../ops/approve-listings.md).
