import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  CodexOAuthDispatchError,
  adjudicateCodexTerminalSSE,
  codexHttpFailureCertainty,
  codexOAuthExecutionReceipt,
  dispatchCodexOAuthRequest,
} from "./oauthPassthrough";

const base = {
  url: "https://example.test/responses",
  headers: { "Idempotency-Key": "tech-scout-stable-key" },
  body: "{}",
};

assert.equal(codexHttpFailureCertainty(429), "provider_rejected");
assert.equal(codexHttpFailureCertainty(500), "uncertain");
assert.equal(codexHttpFailureCertainty(503), "uncertain");
assert.deepEqual(adjudicateCodexTerminalSSE({
  response: { status: "completed", id: "resp_ok" },
  error: null,
}), {
  kind: "completed",
  response: { status: "completed", id: "resp_ok" },
});
assert.deepEqual(adjudicateCodexTerminalSSE({
  response: { status: "failed", error: { code: "provider_failed", message: "failed" } },
  error: null,
}), {
  kind: "provider_terminal_failure",
  code: "provider_failed",
  message: "failed",
});
assert.deepEqual(adjudicateCodexTerminalSSE({
  response: null,
  error: { code: "oauth_empty_terminal_response", message: "Codex returned an empty stream." },
}), {
  kind: "outcome_unknown",
  code: "oauth_empty_terminal_response",
});
assert.deepEqual(adjudicateCodexTerminalSSE({
  response: null,
  error: { code: "oauth_empty_terminal_response", message: "Codex closed the stream without a terminal response event." },
}), {
  kind: "outcome_unknown",
  code: "oauth_empty_terminal_response",
});

const httpSource = readFileSync(fileURLToPath(new URL("./http.ts", import.meta.url)), "utf8");
for (const routePath of ["/v1/chat/completions", "/v1/responses"]) {
  const routeStart = httpSource.indexOf(`http.route({\n  path: "${routePath}"`);
  const route = httpSource.slice(routeStart, routeStart + 40_000);
  assert(routeStart >= 0, `${routePath} must exist`);
  assert.match(
    route,
    /requireCodexOAuthIdempotency\(request\)[\s\S]*?enforcePreCallQuota/,
    `${routePath} must require a caller-stable key before ledger authorization`,
  );
  assert.match(
    route,
    /buildCodexHeaders\([\s\S]*?codexIdempotency!/,
    `${routePath} must forward the same caller key to Codex`,
  );
  const terminalRead = route.indexOf("consumeCodexResponsesSSE(");
  const successRecord = route.indexOf("recordFirstSuccessfulGatewayCall", terminalRead);
  assert(terminalRead >= 0 && successRecord > terminalRead, `${routePath} must record success only after terminal SSE consumption`);
}

{
  let clock = 0;
  const result = await dispatchCodexOAuthRequest({
    ...base,
    now: () => clock,
    overallTimeoutMs: 240_000,
    fetcher: async () => {
      clock = 61_001;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    },
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.attempts, 1);
  assert.equal(clock > 60_000, true, "a controlled response beyond the former 60s boundary must succeed");
  result.dispose();
}

{
  const seenKeys: string[] = [];
  let attempts = 0;
  const result = await dispatchCodexOAuthRequest({
    ...base,
    sleep: async () => {},
    fetcher: async (_url, init) => {
      attempts += 1;
      seenKeys.push(new Headers(init?.headers).get("Idempotency-Key") ?? "");
      if (attempts === 1) return new Response("", { status: 429, headers: { "Retry-After": "0" } });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    },
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.recovered, true);
  assert.deepEqual(seenKeys, ["tech-scout-stable-key", "tech-scout-stable-key"]);
  result.dispose();
}

{
  let attempts = 0;
  const transportCause = new TypeError("socket reset");
  await assert.rejects(
    dispatchCodexOAuthRequest({
      ...base,
      fetcher: async () => {
        attempts += 1;
        throw transportCause;
      },
    }),
    (error: unknown) => {
      assert(error instanceof CodexOAuthDispatchError);
      assert.equal(error.code, "oauth_transport_error");
      assert.equal(error.executionCertainty, "uncertain");
      assert.equal(error.operatorActionRequired, true);
      assert.equal(error.cause, transportCause);
      assert.equal(Object.prototype.propertyIsEnumerable.call(error, "cause"), false);
      return true;
    },
  );
  assert.equal(attempts, 1, "an uncertain transport failure must never be retried");
}

{
  const controller = new AbortController();
  let observedSignal: AbortSignal | undefined;
  const pending = dispatchCodexOAuthRequest({
    ...base,
    requestSignal: controller.signal,
    fetcher: async (_url, init) => {
      observedSignal = init?.signal ?? undefined;
      return await new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(init.signal?.reason), { once: true });
      });
    },
  });
  controller.abort(new Error("client gone"));
  await assert.rejects(pending, (error: unknown) => {
    assert(error instanceof CodexOAuthDispatchError);
    assert.equal(error.code, "client_disconnected_after_dispatch");
    assert.equal(error.executionCertainty, "uncertain");
    return true;
  });
  assert.equal(observedSignal?.aborted, true, "client disconnect must propagate to the provider fetch");
}

{
  const controller = new AbortController();
  let sleepEntered = false;
  const pending = dispatchCodexOAuthRequest({
    ...base,
    fetcher: async () => new Response("", { status: 429, headers: { "Retry-After": "1" } }),
    sleep: async (_delay, signal) => {
      sleepEntered = true;
      return await new Promise<void>((_resolve, reject) => {
        signal?.addEventListener("abort", () => reject(signal.reason), { once: true });
      });
    },
    requestSignal: controller.signal,
  });
  while (!sleepEntered) await new Promise((resolve) => setTimeout(resolve, 0));
  controller.abort(new Error("client gone during safe backoff"));
  await assert.rejects(pending, (error: unknown) => {
    assert(error instanceof CodexOAuthDispatchError);
    assert.equal(error.code, "oauth_retry_budget_exhausted");
    assert.equal(error.executionCertainty, "not_dispatched");
    assert.equal(error.operatorActionRequired, false);
    return true;
  });
}

{
  await assert.rejects(
    dispatchCodexOAuthRequest({
      ...base,
      overallTimeoutMs: 20,
      fetcher: async (_url, init) => {
        return await new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(init.signal?.reason), { once: true });
        });
      },
    }),
    (error: unknown) => {
      assert(error instanceof CodexOAuthDispatchError);
      assert.equal(error.executionCertainty, "uncertain");
      assert.equal(error.attempts, 1);
      return true;
    },
  );
}

{
  const receipt = codexOAuthExecutionReceipt({
    requestId: "idem_test",
    outcome: "outcome_unknown",
    executionCertainty: "uncertain",
    attempts: 1,
    recovered: false,
    operatorActionRequired: true,
    code: "oauth_upstream_timeout",
  });
  assert.deepEqual(receipt, {
    requestId: "idem_test",
    outcome: "outcome_unknown",
    executionCertainty: "uncertain",
    attempts: 1,
    recovery: "not_required_or_exhausted",
    operatorActionRequired: true,
    retryable: false,
    code: "oauth_upstream_timeout",
  });
}

console.log("OAuth passthrough: bounded duration, safe retry, cancellation, and uncertain outcome contracts hold");
