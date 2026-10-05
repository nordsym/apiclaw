# NordSym website service scope runtime repair

Up: [APIClaw README](../../README.md)

The production website conversation returned HTTP 403 with APIClaw error code `oauth_passthrough_required`. Its dedicated website service key, provisioned September 7, remained active with the approved `nordsym-website` scope for `openai/gpt-5.6-sol`. The workspace remained active. No credentials were changed.

Authenticated extraction from production deployment `adventurous-avocet-799` established the actual fault: deployed `apiKeys.js` returned no `serviceScope`, and deployed `http.js` applied the founder OAuth guard without the existing website exemption. The dedicated key's scope persisted in the database and schema while the deployed runtime behavior had been overwritten.

The repair restored the existing scope policy from `convex/websiteServicePolicy.ts` against the actual deployed bundle, changing only `apiKeys.js` and `http.js`. The other 129 modules remained byte-identical. The active schema, application configuration, runtime version, Node configuration, and provider credentials remained unchanged. The founder OAuth guard still rejects ordinary founder keys.

The scoped service credential permits only the approved workspace, POST `/v1/chat/completions`, exact model, non-streaming requests, bounded output up to 1500 tokens, and the existing approved request fields. OAuth and route override headers are denied. The provider route must be direct OpenAI with the exact bare model and endpoint. Other endpoints cannot bypass scope denial through another resolver caller.

Verification:

- Four runnable tests against the extracted patched modules passed. These exercised key scope resolution and revocation, nine forbidden route/body/header combinations before quota, the ordinary founder OAuth guard with no provider dispatch, and the scoped managed OpenAI route returning HTTP 200 through a synthetic provider.
- An independent reviewer repeated the tests and confirmed all eight resolver callers return scope denials, with no actionable findings.
- Production deployment returned success. Authenticated source readback matched both reviewed source hashes, and all 129 other modules remained identical. Schema preparation had no added, dropped, enabled, or disabled indexes; the existing active schema was preserved.
- The operator's production browser conversation then returned a real AI proposal, “Keep Customer Commitments On Track.” Website request submission and analytics completion verification continue in the website task.

The server normalizes omitted source maps to `null` for the two modified modules. Their old maps were omitted because they referred to the pre-repair source. This does not alter event or request behavior.

[Exact deployment patch](2026-10-02-website-service-scope-repair.patch) and [verified deployment evidence](2026-10-02-website-service-scope-repair-evidence.json) record the change. The original authenticated deployment snapshot remains at `/tmp/nordsym-apiclaw-live-config.json` for recovery; applying the recorded patch in reverse restores the original source behavior. These files contain no credentials.

Future backend deployments must preserve the existing website service policy. Current repository source already contains that policy; a broad deployment was deliberately avoided during this incident so unrelated live behavior could be preserved.
