# Customer billing operations

APIClaw offers usage billing, with no monthly platform fee. The first free NASA/Frankfurter call and other verified zero-cost APIs remain free and uncapped. A free workspace has no allowance for nonzero-cost paid execution: the gateway returns `402 payment_required` and `https://apiclaw.cloud/upgrade` before dispatch. Agents should show that link to the human, then retry after billing is verified.

## Customer path

1. Sign in and open Workspace > Billing, or follow `/upgrade` from the agent's message.
2. Select Add payment method. The owner-authenticated landing endpoint forwards the workspace session to the gateway; it cannot select another workspace or choose a cheaper billing mode.
3. Stripe Checkout creates an actual metered usage subscription for ordinary workspaces. Founder and partner accounts retain setup-only Checkout and do not become paid customers.
4. Checkout collects billing address and optional tax ID; applicable tax is calculated by Stripe Tax. Confirming Checkout authorizes monthly usage billing at verified provider cost plus 15%, plus tax.
5. Signed Stripe webhooks reconcile the current customer, payment method, subscription and exact micro-USD meter. The success redirect or a saved-card flag cannot grant paid access alone. A duplicate completed Checkout subscription is canceled rather than leaving two active subscriptions on the same customer meter.
6. The current approved paid rail is OpenRouter chat using `openai/gpt-5.4-nano`, `openai/gpt-5.4-mini` or `openai/gpt-5.4`. `openrouter/auto` selects nano. The nano model has a live action smoke test; mini and standard share the reviewed terms and cost contract but need their own functional coverage.
7. Exact finalized usage enters the existing durable Stripe meter outbox. Unknown, failed or ambiguous costs are not silently promoted from reservations into customer charges. Streaming managed customer responses remain unavailable until exact stream usage can be reconciled.

## Configuration and isolation

Production uses the existing `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_METER_VALUE_UNIT=micro_usd`, `STRIPE_METER_EVENT_NAME_MICRO_USD`, `STRIPE_METER_ID_MICRO_USD` and `STRIPE_PRICE_ID_MICRO_USD` Convex variables. The active price must bill USD 0.000001 per micro-USD unit, use the configured active sum meter and avoid quantity transforms.

Preview must use test Stripe objects and a test key on an isolated Convex deployment. Set `APICLAW_BILLING_ENVIRONMENT=test` and the exact HTTPS preview origin in `APICLAW_BILLING_RETURN_ORIGIN`. Production return URLs remain limited to APIClaw's domains. Never copy a live Stripe key into a purchase test. The preexisting shared development deployment currently contains a live key and is not a safe card-test target.

The NordSym Stripe CLI profile provides a temporary test credential. Check the account is NordSym and the key has not expired before using it; never print it. Test credentials, webhook signing secrets and session tokens belong in environment variables or private operator storage, never in audit documents or PRs.

The APIClaw Stripe endpoint must include `checkout.session.completed`, `checkout.session.async_payment_succeeded`, subscription lifecycle events, `invoice.paid`, `invoice.payment_failed`, payment-method lifecycle events, `setup_intent.succeeded` and `customer.updated`. Preserve existing unrelated NordSym endpoints. A current Swedish tax registration is verified in the live account; other registration obligations depend on customer location and must be checked before expanding sales jurisdictions.

## Release check

Run the repository suite and type checks. In preview, use a new ordinary workspace and a Stripe test card, confirm signed webhook activation, make an approved paid call, verify the immutable meter snapshot and Stripe usage receipt, and confirm failed/unlicensed calls do not become charged usage. A metered subscription starts at zero; opening Checkout or saving a card is not proof of a completed nonzero payment. Verify a separately identified test invoice payment as well.

After deploying production, verify `/upgrade` and a fresh ordinary workspace's actual live subscription Checkout without submitting any real card. Read state back and expire the unused fixture Checkout. Record deployment IDs and the tested environment. See [managed API audit](managed-api-audit.md) for provider scope and unresolved rights/plan evidence.
