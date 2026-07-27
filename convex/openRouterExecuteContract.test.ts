#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const http = readFileSync(fileURLToPath(new URL("./http.ts", import.meta.url)), "utf8");
const executeRouteStart = http.indexOf('http.route({\n  path: "/v1/execute"');
const execute = http.slice(
  executeRouteStart,
  http.indexOf('http.route({\n  path:', executeRouteStart + 1),
);
const chatCompletions = http.slice(
  http.indexOf('path: "/v1/chat/completions"'),
  http.indexOf('path: "/v1/chat/completions"') + 65_000,
);
const openRouterProxy = http.slice(
  http.indexOf('path: "/proxy/openrouter"'),
  http.indexOf('path: "/proxy/openrouter"') + 12_000,
);
const sharedProxyFinalizer = http.slice(
  http.indexOf("async function finalizeProxyJson"),
  http.indexOf("async function finalizeProxyFailure"),
);
const quotaResponse = http.slice(
  http.indexOf("function quotaExceededResponse"),
  http.indexOf("type ManagedCallGate"),
);

assert.match(
  execute,
  /resolveExplicitOpenRouterExecution\(\{[\s\S]*?provider,[\s\S]*?action,[\s\S]*?requestedModel/,
  "execute must resolve the OpenRouter rail before quota authorization",
);
assert.match(
  execute,
  /costBoundedOpenRouterRequest\([\s\S]*?decorateOpenRouterRequest/,
  "execute must strip cost-amplifying options and apply provider price ceilings before dispatch",
);
assert.match(
  chatCompletions,
  /openRouterExecution\?\.provider \?\? "llm"[\s\S]*?costBoundedOpenRouterRequest\([\s\S]*?decorateOpenRouterRequest/,
  "OpenAI-compatible customer chat must use the same cost-bounded OpenRouter rail",
);
assert.match(
  openRouterProxy,
  /costBoundedOpenRouterRequest\([\s\S]*?decorateOpenRouterRequest/,
  "the direct OpenRouter proxy must share the same cost-bounded request builder",
);
assert.match(
  execute,
  /explicitOpenRouterExecution\?\.provider \?\? provider/,
  "the ledger must authorize OpenRouter instead of a generic auto provider",
);
assert.match(
  execute,
  /billingGradeCost: explicitOpenRouterExecution[\s\S]*?\? true/,
  "only the hard-bound OpenRouter path may claim billing-grade LLM cost",
);
assert.match(
  execute,
  /routeLLMRequest\(explicitOpenRouterExecution\?\.routingModel \?\? effectiveModel/,
  "OpenRouter customer calls must not fall through to direct-provider routing",
);
assert.match(
  execute,
  /resolveManagedResponseCost\(\{[\s\S]*?provider: route\.provider/,
  "OpenRouter finalization must fail closed when usage.cost is absent",
);
assert.match(
  execute,
  /const finalization = await finalizeManagedCall\(ctx, quotaGate,[\s\S]*?managedCostReconciliationResponse\(quotaGate, finalization\)[\s\S]*?if \(reconciliationResponse\) return reconciliationResponse/,
  "execute must suppress a customer response when realized spend violates its authorization",
);
assert.match(
  chatCompletions,
  /const finalization = await finalizeManagedCall\(ctx, quotaGate,[\s\S]*?managedCostReconciliationResponse\(quotaGate, finalization\)[\s\S]*?if \(reconciliationResponse\) return reconciliationResponse/,
  "chat completions must suppress a customer response when realized spend violates its authorization",
);
assert.match(
  openRouterProxy,
  /finalizeProxyJson\(ctx, __gate\.managedGate, response, data, model, "openrouter"\)/,
  "the direct OpenRouter proxy must finalize through the shared anomaly-suppressing response path",
);
assert.match(
  sharedProxyFinalizer,
  /const finalization = await finalizeManagedCall[\s\S]*?managedCostReconciliationResponse\(gate, finalization\)[\s\S]*?if \(reconciliationResponse\) return reconciliationResponse/,
  "the shared proxy finalizer must withhold anomalous customer payloads",
);
assert.match(quotaResponse, /costHold \? 503 : 402/);
assert.match(quotaResponse, /code:[\s\S]*?costHold[\s\S]*?"managed_cost_hold"/);
assert.match(quotaResponse, /!costHold[\s\S]*?upgradeUrl/);

console.log("OpenRouter execute: hard-bound routing and exact-cost finalization");
