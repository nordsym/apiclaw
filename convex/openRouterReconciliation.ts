import { internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

type OpenRouterKeyUsage = {
  usage: number;
  usage_daily: number;
  usage_weekly: number;
  usage_monthly: number;
  limit: number | null;
  limit_remaining: number | null;
};

type OpenRouterCredits = {
  total_credits: number;
  total_usage: number;
};

type LocalMonth = {
  monthStart: number;
  attempts: number;
  succeeded: number;
  realizedProviderCostUsd: number;
  reconciliationRequired: number;
};

type OpenRouterReconciliationResult = {
  checkedAt: number;
  upstream: {
    totalCreditsUsd: number;
    totalUsageUsd: number;
    remainingCreditsUsd: number;
    usageDailyUsd: number;
    usageWeeklyUsd: number;
    usageMonthlyUsd: number;
    keyLimitUsd: number | null;
    keyLimitRemainingUsd: number | null;
  };
  localMonth: LocalMonth;
  monthlyDifferenceUsd: number;
};

function finiteNonNegative(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`OpenRouter returned an invalid ${label}`);
  }
  return value;
}

export function parseOpenRouterKeyUsage(value: unknown): OpenRouterKeyUsage {
  const data = (value as { data?: Record<string, unknown> })?.data;
  if (!data) throw new Error("OpenRouter key response is missing data");
  return {
    usage: finiteNonNegative(data.usage, "all-time usage"),
    usage_daily: finiteNonNegative(data.usage_daily, "daily usage"),
    usage_weekly: finiteNonNegative(data.usage_weekly, "weekly usage"),
    usage_monthly: finiteNonNegative(data.usage_monthly, "monthly usage"),
    limit: typeof data.limit === "number" ? data.limit : null,
    limit_remaining: typeof data.limit_remaining === "number" ? data.limit_remaining : null,
  };
}

export function parseOpenRouterCredits(value: unknown): OpenRouterCredits {
  const data = (value as { data?: Record<string, unknown> })?.data;
  if (!data) throw new Error("OpenRouter credits response is missing data");
  return {
    total_credits: finiteNonNegative(data.total_credits, "total credits"),
    total_usage: finiteNonNegative(data.total_usage, "total usage"),
  };
}

export const getLocalMonth = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
    const rows = await ctx.db
      .query("managedCallLedger")
      .withIndex("by_createdAt", (q) => q.gte("createdAt", monthStart))
      .collect();
    const openRouterRows = rows.filter((row) => row.provider.toLowerCase() === "openrouter");
    const realizedProviderCostMicros = openRouterRows.reduce(
      (sum, row) => sum + (row.providerCostMicros ?? 0),
      0,
    );
    return {
      monthStart,
      attempts: openRouterRows.length,
      succeeded: openRouterRows.filter((row) => row.status === "succeeded").length,
      realizedProviderCostUsd: realizedProviderCostMicros / 1_000_000,
      reconciliationRequired: openRouterRows.filter((row) => !!row.reconciliationRequiredAt).length,
    };
  },
});

async function getJson(url: string, key: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${key}` },
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`OpenRouter audit endpoint returned HTTP ${response.status}`);
  const declaredLength = Number(response.headers.get("content-length") || "0");
  if (declaredLength > 64 * 1024) throw new Error("OpenRouter audit response exceeded size limit");
  return response.json();
}

export const reconcile = internalAction({
  args: {},
  handler: async (ctx): Promise<OpenRouterReconciliationResult> => {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) throw new Error("OPENROUTER_API_KEY is not configured");
    const localMonth = await ctx.runQuery(
      internal.openRouterReconciliation.getLocalMonth,
      {},
    ) as LocalMonth;
    const [keyPayload, creditsPayload] = await Promise.all([
      getJson("https://openrouter.ai/api/v1/key", key),
      getJson("https://openrouter.ai/api/v1/credits", key),
    ]);
    const keyUsage = parseOpenRouterKeyUsage(keyPayload);
    const credits = parseOpenRouterCredits(creditsPayload);
    return {
      checkedAt: Date.now(),
      upstream: {
        totalCreditsUsd: credits.total_credits,
        totalUsageUsd: credits.total_usage,
        remainingCreditsUsd: credits.total_credits - credits.total_usage,
        usageDailyUsd: keyUsage.usage_daily,
        usageWeeklyUsd: keyUsage.usage_weekly,
        usageMonthlyUsd: keyUsage.usage_monthly,
        keyLimitUsd: keyUsage.limit,
        keyLimitRemainingUsd: keyUsage.limit_remaining,
      },
      localMonth,
      monthlyDifferenceUsd: keyUsage.usage_monthly - localMonth.realizedProviderCostUsd,
    };
  },
});
