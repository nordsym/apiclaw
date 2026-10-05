# Listing submission notification and operator review

Date: 2026-10-05. Scope: a new workspace's discovery listings, operator notification,
review, publication and withdrawal. No real Arcmira listing was created or approved.

## Released changes

PR #52 merged as `5b435919624cb33d24035d1e171a6930c5fe8424`.
It added submission emails, bounded retries, server-authorized operator review at
`/workspace/review-listings`, revision-safe decisions, required review notes and
submission throttling. Backend and production frontend were deployed.

Live testing found the first two emails in Gmail spam, despite passing SPF, DKIM
and DMARC. Moving one test email to Inbox did not fix subsequent delivery. Inbox
placement is therefore not claimed. PR #53 added the existing Telegram ALERTS
channel as the operational notification path, retaining email. Its merge is
`7b2eddbec103abbb98c2ae032c88acbc80ae5092`; production deployment
`dpl_F5vzgp1gQyZ5nnwTnP5FHS4ZQCj3` was READY with both production aliases.
The backend on `adventurous-avocet-799` was deployed from `dc6ce0e`.

The existing Inbound Net workflow now renders a review link for `listing_review`.
Its existing event templates were preserved and tested. The webhook previously
accepted requests without authentication. It now requires n8n Header Auth using
the same shared secret already sent by APIClaw. Missing and wrong secrets each
returned 403. A real subsequent submission completed the Telegram node successfully.
A transient 404 immediately after workflow republishing was followed by the verified
403 checks; the authenticated submission succeeded on its first attempt.

No new bot, channel, scheduled monitor or paid provider integration was introduced.
Telegram delivery confirms provider acceptance, not that the operator has read it.
Ambiguous delivery timeouts can duplicate Telegram alerts; revision-safe review
prevents a stale approval. Email retries reuse their provider idempotency key.

## Live verification

A fresh operator-provisioned verified Clerk test identity signed in through the
native workspace bridge, creating a new free workspace. This does not verify
self-registration through CAPTCHA. A separate isolated Chromium context signed
in as the existing verified operator. No existing customer workspace was used.

- Owned OpenAPI URL and a newly uploaded YAML file both passed preview, private
  draft, submission and notification in the production UI.
- Ordinary workspace GET/POST review requests returned 403. An operator decision
  for a stale revision returned 409 without publishing it.
- Request changes appeared in the owner UI with the review note. Editing and
  resubmitting produced a fresh revision and notification.
- Operator approvals were performed through the actual review UI, with notes.
- Pending results were absent. Each approved synthetic name appeared in the browser
  catalog, public catalog API and actual authenticated Remote MCP `discover_apis`.
  The MCP connector had only `mcp:read` scope. Callable-only searches returned zero.
- Both `/v1/execute` and `/v1/call` returned 403 `discovery_only` for both fixtures.
  No listed operation was dispatched.
- Telegram executions 40211, 40212 and 40213 succeeded with message receipts.
  The final receipt followed enforcement of webhook authentication.
- Both synthetic listings were withdrawn through the UI. Final catalog and MCP
  searches returned zero, and the drafts remain private for audit and recovery.
- No page errors were observed. The synthetic MCP connector was revoked and its
  previous token returned 401. Isolated browser sessions were signed out and closed.

Before/after workspace records matched: no provider, provider API, direct call,
provider key, purchase or usage-record rows were added; no Stripe customer or
subscription appeared. The pre-import onboarding activation accounted for the
existing single usage count and managed-ledger row. Listing tests added none.
Arcmira discovery returned zero throughout; no real Arcmira publication occurred.

## Regression coverage and operator instructions

Listing unit tests, import SSRF tests, real review-route authorization/CSRF tests,
Convex typecheck and isolated Chromium review-flow tests passed. PR #52 also
passed the full root test suite and landing build/typecheck. PR #53 changed no
landing runtime code. Preview deployments were canceled before building; the
production builds, not those red preview statuses, establish frontend build success.

Open [the review queue](https://apiclaw.cloud/workspace/review-listings), sign in
as the verified operator, inspect ownership and metadata, enter a note, then choose
**Approve discovery listing** or **Request changes**. Approval publishes discovery
metadata only. It grants no gateway execution, key handling or payment capability.

See [the operating guide](../guides/discovery-listings.md) and the
[sanitized live evidence](2026-10-05-listing-review-live-evidence.json).
