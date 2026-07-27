import assert from "node:assert/strict";
import {
  parseOpenRouterCredits,
  parseOpenRouterKeyUsage,
} from "./openRouterReconciliation";

assert.deepEqual(parseOpenRouterCredits({ data: { total_credits: 85, total_usage: 65.5 } }), {
  total_credits: 85,
  total_usage: 65.5,
});
assert.deepEqual(parseOpenRouterKeyUsage({
  data: {
    usage: 65.5,
    usage_daily: 0,
    usage_weekly: 1,
    usage_monthly: 2,
    limit: null,
    limit_remaining: null,
  },
}), {
  usage: 65.5,
  usage_daily: 0,
  usage_weekly: 1,
  usage_monthly: 2,
  limit: null,
  limit_remaining: null,
});
assert.throws(() => parseOpenRouterCredits({ data: { total_credits: -1, total_usage: 0 } }));

console.log("OpenRouter reconciliation parses only finite non-negative upstream usage");
