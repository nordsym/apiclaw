# Workspace state deployment, 2026-09-12

Gustav explicitly approved frontend and Convex deployment after the local verification report, including immediate rollback on a detected regression.

## Released

- Code: `d70e88de3aa655ce9fe296498689a64f6087eca9`.
- Convex production: `adventurous-avocet-799`, deployment completed with typechecking enabled. No index deletion or schema migration.
- Vercel production: `dpl_7BiBzhCxftS1QnwzG3jedSVZC1Za`, https://apiclaw-9cozbamx3-gustavs-projects-0c9f35af.vercel.app . Built without moving the domain, then promoted after backend/webhook verification. `apiclaw.cloud` resolves to this deployment.
- Build command was explicitly `next build`, matching local verification, rather than regenerating unrelated registry/statistics assets during release.
- Stripe: added `customer.updated` to APIClaw's existing enabled webhook endpoint. All existing subscriptions were preserved; no other webhook endpoints were changed.

## Production evidence

- `/`, `/workspace`, `/sign-in`, and `/docs`: HTTP 200.
- Existing authenticated browser successfully reloaded the new workspace. Navigating to `/sign-in` returned to the verified workspace without logging out or replacing the user identity.
- Clerk's real API reports active sessions for the operator. Vercel serverless request logs show `/api/workspace-auth/session` returning 200.
- Billing in the browser shows Founder, Link Connected, Payment method connected, and Manage payment method. No setup prompt.
- Stripe's current customer default is a saved Link payment method, with no Stripe subscription. Convex independently reports `tier: founder`, `hasPaymentMethod: true`, `paymentMethodType: link`. No fabricated card digits or subscription upgrade.
- Re-sent the existing real Stripe `customer.updated` event `evt_1UEbSzRtJYK3aJTqzSKnVyaL` through Stripe to APIClaw. Convex ledger: `succeeded`, one attempt, received `1789172555156`, completed `1789172555403`. Stripe subsequently reports `pending_webhooks: 0`.
- Agents shows historical workspace usage and last-reported model timestamp. Settings loads saved workspace/routing/key data. Activity shows real usage with Not measured for unavailable latency. Provider Console loads verified membership and its empty API listing.
- Vercel deployment error-log query returned zero records during the postdeploy check. This is a bounded observation, not a guarantee of future availability.

No new charge, payment-method attachment/removal, subscription, or invoice was created. The Stripe connector required reauthentication; verification used the existing project server credentials without exposing them.

## Rollback and limits

No product regression was detected, so no rollback was performed. Prior Vercel deployment is `dpl_4r1fMusoBj4QJ6ZLnimYN6vBA8YH`, https://apiclaw-oedzbtvl4-gustavs-projects-0c9f35af.vercel.app . Backend rollback source is `d1bd01a` and includes the already-live serviceScope contract. A prepared detached checkout remains at `/tmp/apiclaw-state-rollback-d1bd01a`.

Historical reconstruction and continuous agent heartbeat remain the limits documented in the repair report. The live check verifies existing Clerk sessions and their workspace return, current Stripe state, and actual webhook transport/processing. It does not claim a new-account signup, card entry, card removal, new charge, or session-expiry soak test.

Implementation source remains committed on `codex/workspace-state-consistency`; no blind push of inherited local main history was performed.
