# APIClaw idempotency binding v1

APIClaw returns HTTP 409 when a managed request with the same canonical
idempotency identity was already accepted. A replay never dispatches a second
upstream request.

The response keeps the existing `requestId`, `ledgerId`, `reason`, `outcome`
and optional `terminalReceipt` fields. It adds:

- `idempotencyBinding`: a client-verifiable binding between the caller's
  outbound `Idempotency-Key` and the canonical original request.
- `receipt`: APIClaw's current truth about the original request.

The raw `Idempotency-Key` is never returned, persisted by this contract or
included in the receipt.

Use high-entropy opaque idempotency keys. The digest is a correlation proof,
not authentication, and a low-entropy key can be guessed offline by a party
that obtains the response.

## Binding verification

The current scheme is `sha256_key_request_v1`.

```text
bindingInput =
  "apiclaw-idempotency-binding/v1" +
  "\n" +
  canonicalRequestId +
  "\n" +
  outboundIdempotencyKey

expectedDigest = "ib_" + lowercaseHex(SHA-256(UTF-8(bindingInput)))
```

A client may reconcile a replay only when all of these checks pass:

1. `version` is exactly `apiclaw-idempotency-binding/v1`.
2. `method` is exactly `sha256_key_request_v1`.
3. `bound` is `true`.
4. `currentRequestId`, `originalRequestId`, outer `requestId` and
   `receipt.requestId` are the same valid `idem_` plus 64 lowercase hex ID.
5. The digest exactly matches the client's outbound key and that request ID.
6. When `terminalReceipt` exists, its request ID also matches.
7. The receipt fields form one of the valid states below.

Any failed check is `outcome_unknown`. It must never authorize a retry.

## Receipt states

| Original state | Status | Outcome | Execution certainty | Terminal | Response recoverable |
| --- | --- | --- | --- | --- | --- |
| Completed | `succeeded` | `succeeded` | `completed` | `true` | `false` |
| Known terminal failure | `failed` | `terminal` | Provider terminal certainty | `true` | `false` |
| Accepted and still open | `authorized` | `in_progress` | `uncertain` | `false` | `false` |
| APIClaw ledger closed, provider outcome uncertain | `failed` | `outcome_unknown` | `uncertain` | `true` | `false` |
| Missing, malformed or contradictory binding evidence | no trusted receipt | `outcome_unknown` | unavailable | unavailable | `false` |

`retryable` is always `false` for HTTP 409. APIClaw does not persist managed
model response bodies, so a completed replay proves completion but cannot
recover response content.

`terminal: true` means APIClaw's ledger is closed. It does not by itself prove
that the provider completed or rejected execution. Clients must use
`executionCertainty` and `outcome` for that judgment.

The optional `code` is emitted only for APIClaw's explicit safe allowlist of
stable terminal codes. Arbitrary provider text is omitted from replay responses.

## Compatibility fixture

[`fixtures/apiclaw-idempotency-binding-v1.json`](../fixtures/apiclaw-idempotency-binding-v1.json)
contains exact response-body fixtures and non-secret verification inputs for
completed, terminal-failed, in-progress, terminal-unknown and unbound-missing
states.
