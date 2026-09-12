# Workspace state repair, 2026-09-12

Status at initial handoff: implemented and locally verified, awaiting explicit deploy approval. Deployment was subsequently approved and completed; see [production verification](2026-09-12-workspace-state-deployment.md).

## Implemented changes

| Audit | Root cause and repair | Surfaces |
| --- | --- | --- |
| F01-F03 | Removed fabricated account defaults; strict transport/envelope checks and known response-shape validation; expired-session list queries now fail explicitly. Read recovery renews the browser child once. Mutations are never automatically replayed. | Workspace/sidebar, standalone shell, account/plan, agents, logs, keys, connectors |
| F02/F11 | Shared revision invalidation on successful mutations, token changes, focus, visibility, pageshow, and visible 30-second refresh. Account and provider readers refresh together. Request generations discard superseded responses. Catalog execution invalidates account state. | Workspace, Agents, Settings, Activity, Billing, Provider Console, onboarding, chains |
| F04/F05 | Main identity totals explicitly say historical workspace calls. Model says last reported with timestamp/unknown. Presence describes recent observation rather than a live connection. | Symbot, agent cards |
| F06/F07 | Successful recovery clears read errors; agent edits retain drafts after failed saves. API-key timestamp explicitly labeled historical last use. | Agent cards, connectors, API keys/BYOK |
| F08/F09 | Failed/partial activity queries show errors instead of empty results. Placeholder zero latency excluded from averages and displayed as not measured. Billing current-month spend uses the same reset boundary as the account dashboard. | Activity, provider latency, Billing |
| F10 | Provider membership is retained on failed refresh with account error feedback; analytics blocks totals until loaded. Config/action requests use shared contracts and generation protection. | Provider Console and navigation |
| F12 | Billing refresh participates in shared revision. Saved payment method leads to Manage payment method even on Free. Card presence is separate from subscription status; unknown payment state does not show a connected badge or verified totals. customer.updated reads current Stripe state; removal supports a surviving Link method. | Billing, Stripe webhook |
| F13 | Unknown onboarding state is an explicit error; failed complete/dismiss writes do not close the dialog or claim success. | Onboarding |
| F14 | Agent choice no longer equates every agent with MCP. Connection help mentions CLI/HTTP/SKILL.md. Docs links point at current Settings/Agents destinations. Public header uses neutral Workspace entry. | Onboarding, Agents, Docs, header |
| F15 | Stripe checkout/portal returns revalidate shared data; cancellation also refreshes. CLI completion text does not assert a verified connection. OAuth uses strict response decoding. Legacy provider routes preserve API identity. Standalone chains expose read failures and refresh traces. | External returns, CLI/OAuth, legacy routes, chains |
| F16 | Dirty name/routing/provider drafts resist background refresh. Submitted fields are disabled while saving; failure retains the draft. Theme listens for cross-tab storage changes. | Settings, Provider Console, theme |

Feedback remains a mailto link, with no stored submission or success state. No outbound feedback was sent.

## Verification

- All 82 entries in the repository test command passed. Individual exit results are in `2026-09-12-test-results.json`.
- All 24 browser scenarios passed in the local browser against actual React components, synthetic data, and blocked external network requests. Reproduction: `landing/tests/workspace-state/README.md`.
- Root TypeScript check passed.
- Landing TypeScript check passed.
- Next production build passed, including type validation and all 50 static pages.
- `git diff --check` passed.
- Build emitted existing tooling warnings about outdated Browserslist data, experimental Type Stripping and edge static generation. No build failure.

## Remaining findings and limits

1. Historical data is not reconstructed. The old workspace-level Symbot counter, retired key timestamps and unknown/zero latency samples cannot establish historical per-agent usage or exact latency. They are labeled or excluded, never silently rewritten. No database backfill is included.
2. A recent agent observation is not a heartbeat or proof of current connection health. The label now reflects that limit. A full live-presence protocol is outside this repair.
3. Saved payment method and subscription entitlement are independent. Adding a card does not rename a Free account to a paid subscription. The UI no longer treats that fact as unfinished card setup. A true Founder entitlement still comes from the verified account response.
4. Production Stripe webhook delivery, including customer.updated subscription, must be verified after the approved release. Reading current Stripe state reduces stale event snapshots but does not establish transactional ordering across simultaneous webhook executions. No claim of exactly-once processing is made.
5. Browser regression uses synthetic network responses. Real Clerk session renewal, Stripe return, deployed Convex contracts, and default-card changes need the postdeploy smoke check; no real card/account mutation was performed in this implementation run.
6. The pre-existing local history contains the already-live serviceScope backend change. Do not push this branch's inherited main history blindly. Release this scoped change while preserving the existing live backend contract; no unrelated migration or history rewrite.

## Release gate

Local code checks are green. Ready for an explicitly approved frontend + Convex release, followed by owner-scoped production smoke verification. Not yet certified as deployed or live E2E verified. Gustav owns deploy approval. Keep the current production deployment available for rollback. No schema migration or historical data rewrite is required.
