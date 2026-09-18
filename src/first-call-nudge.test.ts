#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  APICLAW_UPGRADE_URL,
  FIRST_CALL_REVENUE_NUDGE_MESSAGE,
  PAYMENT_REQUIRED_MESSAGE,
  attachFirstCallRevenueNudge,
  firstCallRevenueNudge,
  workspaceHasPaymentMethod,
} from "./first-call-nudge.js";

assert.equal(APICLAW_UPGRADE_URL, "https://apiclaw.cloud/upgrade");
assert.match(FIRST_CALL_REVENUE_NUDGE_MESSAGE, /First call landed/);
assert.match(FIRST_CALL_REVENUE_NUDGE_MESSAGE, /https:\/\/apiclaw\.cloud\/upgrade/);
assert.match(FIRST_CALL_REVENUE_NUDGE_MESSAGE, /OpenRouter/);
assert.match(FIRST_CALL_REVENUE_NUDGE_MESSAGE, /15%/);
assert.match(PAYMENT_REQUIRED_MESSAGE, /https:\/\/apiclaw\.cloud\/upgrade/);
assert.match(PAYMENT_REQUIRED_MESSAGE, /retry this same call/);
assert.match(PAYMENT_REQUIRED_MESSAGE, /15 percent/);

assert.equal(workspaceHasPaymentMethod({}), false);
assert.equal(workspaceHasPaymentMethod({ hasPaymentMethod: false }), false);
assert.equal(workspaceHasPaymentMethod({ hasPaymentMethod: true }), true);
assert.equal(workspaceHasPaymentMethod({ hasCardAttached: true }), true);
assert.equal(workspaceHasPaymentMethod({ hasPaymentMethod: false, hasCardAttached: true }), true);

const noCardFirstCall = firstCallRevenueNudge({
  firstCallRecorded: true,
  hasPaymentMethod: false,
  billingClass: "activation",
});
assert.deepEqual(noCardFirstCall, {
  kind: "add_payment_method",
  message: FIRST_CALL_REVENUE_NUDGE_MESSAGE,
  upgradeUrl: APICLAW_UPGRADE_URL,
});

assert.equal(
  firstCallRevenueNudge({
    firstCallRecorded: true,
    hasPaymentMethod: true,
    billingClass: "activation",
  }),
  null,
  "a card on file must not get the post-first-call billing nudge",
);

assert.equal(
  firstCallRevenueNudge({
    firstCallRecorded: false,
    hasPaymentMethod: false,
    billingClass: "activation",
  }),
  null,
  "later free calls must not repeat the first-call nudge",
);

assert.equal(
  firstCallRevenueNudge({
    firstCallRecorded: true,
    hasPaymentMethod: false,
    billingClass: "payg",
  }),
  null,
  "a paid-class success is not the free first-call nudge",
);

const attached = attachFirstCallRevenueNudge(
  { success: true, provider: "nasa", action: "apod", data: { title: "Helix" } },
  noCardFirstCall,
);
assert.equal(attached._notice, FIRST_CALL_REVENUE_NUDGE_MESSAGE);
assert.deepEqual(attached.next_step, noCardFirstCall);
assert.equal(attached.success, true);

const untouched = attachFirstCallRevenueNudge(
  { success: true, provider: "nasa", action: "apod" },
  null,
);
assert.equal("_notice" in untouched, false);
assert.equal("next_step" in untouched, false);

const http = readFileSync("convex/http.ts", "utf8");
assert.match(http, /firstCallRevenueNudge/, "execute must decide the first-call nudge from shared copy");
assert.match(http, /attachFirstCallRevenueNudge/, "execute success must attach _notice/next_step");
assert.match(http, /PAYMENT_REQUIRED_MESSAGE/, "402 fallback must use the agent-actionable payment_required copy");
assert.match(
  http.slice(http.indexOf("function quotaExceededResponse"), http.indexOf("type ManagedCallGate")),
  /upgradeUrl/,
  "payment_required must keep upgradeUrl on the 402 body",
);

const policy = readFileSync("convex/managedUsagePolicy.ts", "utf8");
assert.match(policy, /PAYMENT_REQUIRED_MESSAGE/, "managedQuotaMessage must include the upgrade URL");

const skill = readFileSync("landing/public/SKILL.md", "utf8");
assert.match(skill, /After the first 200/);
assert.match(skill, /one cheap paid next step/i);
assert.match(skill, /https:\/\/apiclaw\.cloud\/upgrade/);
assert.match(skill, /payment_required/);
assert.match(skill, /retry the same call/);
assert.match(skill, /Do not make the first call a paid API|Do not lead with billed research/);

const agents = readFileSync("landing/public/agents.md", "utf8");
assert.match(agents, /https:\/\/apiclaw\.cloud\/upgrade/);
assert.match(agents, /payment_required/);
assert.match(agents, /retry the same call/);
assert.match(agents, /NASA APOD/);
assert.match(agents, /one cheap paid next step/i);

const mcp = readFileSync("src/index.ts", "utf8");
assert.match(mcp, /result\._notice/, "MCP call_api must surface the gateway first-call notice");
assert.match(mcp, /result\.upgradeUrl/, "MCP call_api must surface payment_required upgradeUrl");

const gateway = readFileSync("src/gateway-client.ts", "utf8");
assert.match(gateway, /_notice: typeof json\._notice === "string"/);
assert.match(gateway, /upgradeUrl: typeof errObj\?\.upgradeUrl === "string"/);

console.log("first-call nudge: no-card first call attaches notice; card skips it; payment_required keeps upgrade URL");
