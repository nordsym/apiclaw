import { internalAction, internalQuery } from "./_generated/server";
import { internal, api } from "./_generated/api";

/**
 * Catalog Sweep — rotating reachability probe over the Open (keyless, free)
 * tier of providerAPIs. Feeds the existing circuit-breaker fields
 * (healthStatus / consecutiveFailures / circuitOpenUntil via
 * pipelineAlign.reportSuccess/reportFailure) so providers that never get
 * real user traffic still get a health signal, instead of sitting cold
 * until a real caller hits a dead endpoint.
 *
 * GET-only against each provider's baseUrl root. Never re-executes a
 * specific action/path — this is a liveness probe, not a functional test,
 * and it must never trigger a side effect on a third party's system.
 * Any HTTP response (even 4xx — many APIs 404/405 a bare root GET) counts
 * as "reachable"; only network failures, timeouts, and 5xx count as down.
 */

const BATCH_SIZE = 100;
const CONCURRENCY = 15;
const FETCH_TIMEOUT_MS = 6000;

export const getBatch = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("providerAPIs")
      .withIndex("by_listingStatus", (q) => q.eq("listingStatus", "live"))
      .collect();

    // Open tier only: keyless, no NordSym credentials involved.
    const openRows = rows.filter((r) => r.authType === "none" && r.baseUrl);

    // Least-recently-checked first — rotates through the full open catalog
    // over successive runs without needing an explicit cursor doc.
    openRows.sort((a, b) => (a.lastHealthCheckAt ?? 0) - (b.lastHealthCheckAt ?? 0));

    return openRows.slice(0, BATCH_SIZE).map((r) => ({
      apiId: r._id,
      baseUrl: r.baseUrl as string,
      name: r.name,
    }));
  },
});

async function probeOne(item: { apiId: any; baseUrl: string; name: string }) {
  try {
    const res = await fetch(item.baseUrl, {
      method: "GET",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    return { apiId: item.apiId, ok: res.status < 500, statusCode: res.status };
  } catch {
    // Network error, DNS failure, or timeout — genuinely unreachable.
    return { apiId: item.apiId, ok: false, statusCode: undefined as number | undefined };
  }
}

export const sweep = internalAction({
  args: {},
  handler: async (ctx): Promise<{ checked: number; healthy: number; failed: number }> => {
    const batch = await ctx.runQuery(internal.catalogSweep.getBatch, {});

    let healthy = 0;
    let failed = 0;

    for (let i = 0; i < batch.length; i += CONCURRENCY) {
      const chunk = batch.slice(i, i + CONCURRENCY);
      const results = await Promise.all(chunk.map(probeOne));
      for (const r of results) {
        if (r.ok) {
          healthy++;
          await ctx.runMutation(api.pipelineAlign.reportSuccess, { apiId: r.apiId });
        } else {
          failed++;
          await ctx.runMutation(api.pipelineAlign.reportFailure, {
            apiId: r.apiId,
            statusCode: r.statusCode,
          });
        }
      }
    }

    return { checked: batch.length, healthy, failed };
  },
});
