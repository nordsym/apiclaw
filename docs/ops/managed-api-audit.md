# Managed API audit

Last run: 2026-10-14  
Environment: production gateway, `https://api.apiclaw.cloud/v1/execute`  
Code baseline: `692ea745`  
Workspace: APIClaw website workspace, using internal audit authorization  

This document records which managed adapters have fresh action-level evidence and which ones APIClaw may advertise as customer-callable. It contains no credentials, customer payloads, or upstream response bodies.

## Commercial boundary

APIClaw has two customer rails:

- Free: discovery, workspace-authenticated public or no-key HTTPS APIs, and a small managed trial after login. The managed trial ends at the first of 25 successful calls or USD 1 in provider cost.
- PAYG: the provider cost plus a 15% APIClaw margin, reported through the configured Stripe micro-USD meter.

PAYG resale is limited to OpenAI, xAI, Anthropic, Groq, OpenRouter, Mistral, DeepInfra, and APILayer. Brave and Serper may be used during the free managed allowance but are not sold through PAYG. GitHub public reads are free-only when healthy and are currently hidden because the live adapter failed.

APIClaw holds the APILayer subscription and injects the managed credential. Customers do not configure an APILayer key. APILayer confirmed the provider-cost-plus-15% model by email on 2026-04-16. The formal partnership agreement sent on 2026-04-15 still has unconfirmed signature status, so this audit does not claim a signed partnership.

## 2026-10-14 action smoke test

Each test used one bounded, low-cost request through the same public execution gateway customers use. The audit checked the returned success flag, media type or response shape, and gateway latency. Secrets and full response payloads were neither printed nor retained here.

| Adapter | Sanitized request profile | Result | Customer-callable decision |
| --- | --- | --- | --- |
| Cohere | One short chat request using `command-a-03-2025` | Fail before upstream: model had no billing-grade price | Hide actions until model pricing and the request contract are verified |
| ElevenLabs | Short text-to-speech sample | Pass: MPEG audio, 20,523 bytes, 996 ms | Keep callable |
| Deepgram | Transcribe one short public audio sample | Pass, 941 ms | Keep callable |
| AssemblyAI | Submit one short public audio sample for transcription | Pass: upstream accepted transcript `96d58d2d-fb94-4b0f-8675-6dc3573d3354`, status `processing`, 345 ms | Keep callable for submission; completion polling remains an operational follow-up |
| Replicate | Minimal prediction request through the advertised `run` action | Fail: upstream HTTP 422 because a valid model version was not safely expressed by the advertised contract | Hide actions until the adapter exposes a complete, validated model contract |
| Stability | Generate one minimal image | Pass, 4,074 ms | Keep callable |
| GitHub | Read one private repository, then one public repository | Fail twice: upstream HTTP 403, including the public control request | Hide actions until unauthenticated rate-limit behavior is made reliable or an owner-scoped connection exists |
| E2B | Run `2 + 2`, verify stdout, then clean up the sandbox | Pass: stdout `4`, cleanup completed, 1,158 ms | Keep callable |

The inventory remains 22 built-in adapters. Removing only the customer actions for Cohere, Replicate, and GitHub leaves 19 customer-executable managed providers. Together with 1,003 workspace-public origins, the callable catalog contains 1,022 cards.

## Serper follow-up

The passive provider history showed two failures and no successes. A fresh bounded search for `APIClaw` with one requested organic result passed on 2026-10-14, returning one organic result in 955 ms. Serper therefore remains callable within the free managed allowance, but remains outside the PAYG resale allowlist.

## Billing controls checked

- A saved card is not, by itself, a PAYG entitlement.
- Paid execution requires an active or trialing subscription attached to the exact configured Stripe price, meter, and event name.
- Each successful PAYG call creates one immutable ledger row with frozen customer, subscription, price, meter, event, and micro-USD amount fields.
- The reporter uses a deterministic event identifier, so retries cannot intentionally double-report one ledger row.
- The Billing tab reads current-month totals and pending or reported state from the immutable ledger rather than the legacy workspace spend counter.
- Founder and partner tiers keep their visible tier label, but normal customer-authenticated requests become PAYG after exact activation. Only requests carrying explicit internal authorization remain nonbillable.
- Preview metering requires `APICLAW_BILLING_ENVIRONMENT=test` with an `sk_test_` key. Production requires `live` with an `sk_live_` key. A mismatch blocks Checkout, webhooks, and the scheduled meter reporter.

## Saved-card repair

After the corrected Convex functions and exact Stripe meter configuration are deployed, repair each audited workspace separately:

```bash
npx convex run stripeActions:repairSavedCardPayg '{"workspaceId":"<workspace-id>"}' --prod
```

The operator must supply the exact workspace ID from an authenticated audit. The repair accepts no secret argument, verifies the saved Stripe payment method, reuses an existing exact-price subscription when possible, and refuses ineligible workspaces. Read the workspace and Stripe subscription back after each run before moving to the next customer.

## Rerun procedure

1. Confirm the selected Convex deployment with `npx convex run providerAudit:snapshot '{}' --prod`. This is a passive inventory check only.
2. Use an internal audit authorization tied to a known APIClaw workspace. Keep it in a shell variable and never print it.
3. Send one smallest-valid request per action to `https://api.apiclaw.cloud/v1/execute` with a unique idempotency key.
4. Record only provider, action, HTTP status, success flag, media type or safe shape, latency, and any sanitized upstream error class.
5. For asynchronous APIs, poll to a terminal state when the adapter exposes a safe polling action. Otherwise label the evidence as submission-only.
6. Confirm every created sandbox or job is cleaned up where the provider supports cleanup.
7. Update `customerExecutableActions` only from fresh evidence, then run:

   ```bash
   npx tsx src/product-truth.test.ts
   npx tsx convex/managedProviderPathSafety.test.ts
   npx tsx convex/managedCostPolicy.test.ts
   npm test
   ```

8. Regenerate public stats and confirm the landing catalog count before deployment.

Do not make production smoke calls with customer data. Keep each request bounded and stop if the projected provider cost is unclear.

## Required APILayer cost configuration

APILayer PAYG is fail-closed until each customer-callable action has an audited underlying cost. Configure `APILAYER_PROVIDER_COST_USD_BY_ACTION_JSON` as a JSON object from canonical action name to APIClaw's allocated provider cost in USD, for example `{"exchange_rates":0.006}`. These values must come from the current managed APILayer subscription economics. Missing, malformed, zero, negative, or non-numeric values keep that action unavailable rather than guessing a customer charge.
