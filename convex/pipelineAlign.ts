import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * GTM alignment: binary funnel.
 *
 *   Discovery — searchable universe (full 20k+ registry)
 *   Callable  — 46 managed managed-provider + ~1,635 keyless Open APIs
 *
 * Rules (IRONCLAD):
 *   - No row is ever deleted.
 *   - Workspaces, apiKeys, agentSessions, analytics, funnelEvents are NEVER touched.
 *   - Only patches rows whose classification is missing or stale.
 *   - Safe to re-run; patches converge to the same terminal state.
 */

// ---------------------------------------------------------------------------
// Step 1 — Flag the existing 46 managed managed providers.
// Identifies them by presence of providerId (the 1,660 registry seed has none).
// ---------------------------------------------------------------------------
export const classifyManaged = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("providerAPIs").collect();
    let patched = 0;
    for (const api of all) {
      const isManaged = !!api.providerId;
      if (!isManaged) continue;
      if (
        api.listingStatus === "live" &&
        api.authType === "managed" &&
        (api.proxyMode === "managed" || api.proxyMode === "direct_call")
      ) continue;
      await ctx.db.patch(api._id, {
        listingStatus: "live",
        authType: "managed",
        proxyMode: "managed",
        healthStatus: api.healthStatus ?? "healthy",
      });
      patched++;
    }
    return { scope: "managed", patched };
  },
});

// ---------------------------------------------------------------------------
// Step 1b — one-shot backfill: rewrite proxyMode "direct_call" → "managed"
// on every providerAPIs row that still carries the retired literal. New
// writers already emit "managed"; readers accept both during the transition
// so this can run any time without coordination.
// ---------------------------------------------------------------------------
export const backfillProxyModeToManaged = mutation({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("providerAPIs").collect();
    let patched = 0;
    for (const row of rows) {
      if (row.proxyMode === "direct_call") {
        await ctx.db.patch(row._id, { proxyMode: "managed" });
        patched++;
      }
    }
    return { patched, total: rows.length };
  },
});

// ---------------------------------------------------------------------------
// Step 2 — Reclassify the earlier registry-final.json seed from "indexed" to
// the binary-funnel "discovery" lane. Keyless entries get upgraded to "live"
// in classifyOpenByNames (step 3). Everything else lands in discovery.
// ---------------------------------------------------------------------------
export const reclassifyIndexed = mutation({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("providerAPIs")
      .withIndex("by_listingStatus", (q) => q.eq("listingStatus", "indexed"))
      .collect();
    let patched = 0;
    for (const api of rows) {
      // Skip if this entry will be (or already is) classified as a keyless Open API.
      if (api.authType === "none" || api.listingStatus === "live") continue;
      await ctx.db.patch(api._id, {
        listingStatus: "discovery",
        authType: api.authType ?? "unknown",
        proxyMode: api.proxyMode ?? "discovery_only",
      });
      patched++;
    }
    return { scope: "indexed_to_discovery", patched };
  },
});

// ---------------------------------------------------------------------------
// Step 3 — Upsert the 1,635 keyless Open APIs from apis.json.
// Called in batches from scripts/seed-open-apis.mjs with {name, baseUrl, …}.
// Idempotent: if a row with the same name exists, it's patched up; otherwise
// a new row is inserted. No deletes. No overwrites of fields the caller
// didn't supply.
// ---------------------------------------------------------------------------
export const upsertOpenAPIs = mutation({
  args: {
    entries: v.array(
      v.object({
        name: v.string(),
        description: v.string(),
        category: v.string(),
        baseUrl: v.string(),
        docsUrl: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, { entries }) => {
    const now = Date.now();
    let inserted = 0;
    let patched = 0;
    let unchanged = 0;

    for (const entry of entries) {
      const existing = await ctx.db
        .query("providerAPIs")
        .withIndex("by_name", (q) => q.eq("name", entry.name))
        .collect();

      if (existing.length === 0) {
        await ctx.db.insert("providerAPIs", {
          name: entry.name,
          description: entry.description,
          category: entry.category,
          baseUrl: entry.baseUrl,
          docsUrl: entry.docsUrl ?? entry.baseUrl,
          pricingModel: "free",
          status: "active",
          listingStatus: "live",
          authType: "none",
          proxyMode: "open_proxy",
          healthStatus: "healthy",
          discoveryCount: 0,
          createdAt: now,
        });
        inserted++;
        continue;
      }

      // Patch-up semantics: never demote, never overwrite non-empty fields unless stale.
      // IRONCLAD: NEVER overwrite a managed row (one with providerId) — those hold
      // APIClaw-owned credentials via /proxy/{adapter} and must not be downgraded to
      // open_proxy even if the registry has an auth:none duplicate entry.
      const primary = existing.sort((a, b) => a.createdAt - b.createdAt)[0];
      if (primary.providerId || primary.authType === "managed") {
        unchanged++;
        continue;
      }
      const needsUpdate =
        primary.listingStatus !== "live" ||
        primary.authType !== "none" ||
        primary.proxyMode !== "open_proxy" ||
        !primary.baseUrl;
      if (!needsUpdate) {
        unchanged++;
        continue;
      }
      await ctx.db.patch(primary._id, {
        listingStatus: "live",
        authType: "none",
        proxyMode: "open_proxy",
        baseUrl: primary.baseUrl ?? entry.baseUrl,
        docsUrl: primary.docsUrl ?? entry.docsUrl ?? entry.baseUrl,
        healthStatus: primary.healthStatus ?? "healthy",
      });
      patched++;
    }

    return { inserted, patched, unchanged, batchSize: entries.length };
  },
});

// ---------------------------------------------------------------------------
// Circuit-breaker helpers — used inline by /v1/call in http.ts.
// Public mutations so the HTTP layer can report health without a full refactor.
// ---------------------------------------------------------------------------
export const reportSuccess = mutation({
  args: { apiId: v.id("providerAPIs") },
  handler: async (ctx, { apiId }) => {
    const row = await ctx.db.get(apiId);
    if (!row) return;
    if (row.consecutiveFailures === 0 && row.healthStatus === "healthy" && !row.circuitOpenUntil) return;
    await ctx.db.patch(apiId, {
      consecutiveFailures: 0,
      healthStatus: "healthy",
      circuitOpenUntil: undefined,
      lastHealthCheckAt: Date.now(),
    });
  },
});

export const reportFailure = mutation({
  args: {
    apiId: v.id("providerAPIs"),
    statusCode: v.optional(v.number()),
  },
  handler: async (ctx, { apiId, statusCode }) => {
    const row = await ctx.db.get(apiId);
    if (!row) return;
    const fails = (row.consecutiveFailures ?? 0) + 1;
    const isHardFailure = !statusCode || statusCode >= 500 || statusCode === 0;
    const openCircuit = isHardFailure && fails >= 5;
    await ctx.db.patch(apiId, {
      consecutiveFailures: fails,
      healthStatus: fails >= 10 ? "down" : fails >= 3 ? "degraded" : row.healthStatus,
      circuitOpenUntil: openCircuit ? Date.now() + 5 * 60 * 1000 : row.circuitOpenUntil,
      lastHealthCheckAt: Date.now(),
    });
  },
});

// ---------------------------------------------------------------------------
// Reporting — canon for Hero, MCP discover, and ops dashboards.
// ---------------------------------------------------------------------------
export const funnelCounts = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("providerAPIs").collect();
    const byStatus: Record<string, number> = { live: 0, discovery: 0, indexed: 0, unclassified: 0 };
    const byAuth: Record<string, number> = { managed: 0, none: 0, unknown: 0, unclassified: 0 };
    const byHealth: Record<string, number> = { healthy: 0, degraded: 0, down: 0, unclassified: 0 };
    for (const api of all) {
      byStatus[api.listingStatus ?? "unclassified"] = (byStatus[api.listingStatus ?? "unclassified"] ?? 0) + 1;
      byAuth[api.authType ?? "unclassified"] = (byAuth[api.authType ?? "unclassified"] ?? 0) + 1;
      byHealth[api.healthStatus ?? "unclassified"] = (byHealth[api.healthStatus ?? "unclassified"] ?? 0) + 1;
    }
    return {
      total: all.length,
      callable: byStatus.live, // Hero "1,650+"
      discovery: byStatus.discovery + byStatus.indexed + byStatus.unclassified, // Hero "20,386+"
      byStatus,
      byAuth,
      byHealth,
    };
  },
});

/**
 * Used by MCP discover_apis + catalog search. Returns rows with the minimum
 * fields agents need to call, not the full record.
 */
export const searchDiscovery = query({
  args: {
    query: v.optional(v.string()),
    category: v.optional(v.string()),
    callableOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);
    const offset = args.offset ?? 0;

    let rows = args.callableOnly
      ? await ctx.db
          .query("providerAPIs")
          .withIndex("by_listingStatus", (q) => q.eq("listingStatus", "live"))
          .collect()
      : await ctx.db.query("providerAPIs").collect();

    if (args.query) {
      const q = args.query.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.description ?? "").toLowerCase().includes(q) ||
          (r.category ?? "").toLowerCase().includes(q)
      );
    }
    if (args.category) {
      rows = rows.filter((r) => r.category === args.category);
    }

    const total = rows.length;
    const page = rows.slice(offset, offset + limit).map((r) => ({
      id: r._id,
      name: r.name,
      description: r.description,
      category: r.category,
      baseUrl: r.baseUrl ?? r.docsUrl,
      docsUrl: r.docsUrl,
      callable: r.listingStatus === "live",
      authType: r.authType ?? "unknown",
      proxyMode: r.proxyMode ?? "discovery_only",
      healthStatus: r.healthStatus ?? "unknown",
    }));

    return { total, limit, offset, results: page };
  },
});

// ---------------------------------------------------------------------------
// promoteToManaged — Flip a specific providerAPIs row to the managed lane.
// Used when APIClaw acquires a key for a public API (e.g. NASA) and the
// adapter is registered in MANAGED_PROXY_ROUTES. Patch-only, idempotent.
// ---------------------------------------------------------------------------
export const promoteToManaged = mutation({
  args: {
    apiId: v.id("providerAPIs"),
    baseUrl: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, { apiId, baseUrl, category }) => {
    const row = await ctx.db.get(apiId);
    if (!row) return { status: "not_found", apiId };
    const patch: any = {
      authType: "managed",
      listingStatus: "live",
      proxyMode: "managed",
      healthStatus: row.healthStatus ?? "healthy",
      consecutiveFailures: 0,
    };
    if (baseUrl) patch.baseUrl = baseUrl;
    if (category) patch.category = category;
    await ctx.db.patch(apiId, patch);
    return {
      status: "ok",
      apiId,
      name: row.name,
      before: {
        authType: row.authType,
        listingStatus: row.listingStatus,
        proxyMode: row.proxyMode,
      },
      after: patch,
    };
  },
});

// ---------------------------------------------------------------------------
// patchApiMetadata — Patch description / docsUrl / category on a registry row
// without touching classification fields. Used for demo-hygiene adjustments
// (e.g. steering agents away from retired upstream endpoints).
// ---------------------------------------------------------------------------
export const patchApiMetadata = mutation({
  args: {
    apiId: v.id("providerAPIs"),
    description: v.optional(v.string()),
    docsUrl: v.optional(v.string()),
    category: v.optional(v.string()),
    baseUrl: v.optional(v.string()),
  },
  handler: async (ctx, { apiId, description, docsUrl, category, baseUrl }) => {
    const row = await ctx.db.get(apiId);
    if (!row) return { status: "not_found" };
    const patch: any = {};
    if (description !== undefined) patch.description = description;
    if (docsUrl !== undefined) patch.docsUrl = docsUrl;
    if (category !== undefined) patch.category = category;
    if (baseUrl !== undefined) patch.baseUrl = baseUrl;
    if (Object.keys(patch).length === 0) return { status: "noop" };
    await ctx.db.patch(apiId, patch);
    return { status: "ok", apiId, name: row.name, patch };
  },
});
