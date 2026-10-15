import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { WORKSPACE_PUBLIC_APIS, buildPinnedPublicApiUrl, type WorkspacePublicApi } from "../src/workspace-public-apis";
import { decodePublicApiResponse } from "../src/workspace-public-response";
import { fetchWorkspacePublicGet } from "../src/workspace-public-transport";

const APPROVED_IDS = new Set(WORKSPACE_PUBLIC_APIS.map((api) => api.id));
const BATCH_SIZE = 20;

export const isHealthy = internalQuery({
  args: { apiId: v.string() }, returns: v.boolean(),
  handler: async (ctx, { apiId }) => {
    if (!APPROVED_IDS.has(apiId)) return false;
    const row = await ctx.db.query("publicApiHealth").withIndex("by_apiId", (q) => q.eq("apiId", apiId)).unique();
    return row?.healthy ?? true;
  },
});

export const snapshot = query({
  args: {}, returns: v.object({ disabledIds: v.array(v.string()), checkedAt: v.union(v.number(), v.null()) }),
  handler: async (ctx) => {
    const rows = await Promise.all(WORKSPACE_PUBLIC_APIS.map((api) =>
      ctx.db.query("publicApiHealth").withIndex("by_apiId", (q) => q.eq("apiId", api.id)).unique()));
    return {
      disabledIds: rows.filter((row) => row?.healthy === false).map((row) => row!.apiId),
      checkedAt: rows.length > 0 && rows.every((row) => row !== null)
        ? Math.min(...rows.map((row) => row!.checkedAt)) : null,
    };
  },
});

export const record = internalMutation({
  args: { apiId: v.string(), healthy: v.boolean(), status: v.number(), checkedAt: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!APPROVED_IDS.has(args.apiId)) throw new Error("Public API is not approved");
    const existing = await ctx.db.query("publicApiHealth").withIndex("by_apiId", (q) => q.eq("apiId", args.apiId)).unique();
    // A delayed previous sweep must not replace a newer outcome.
    if (existing && existing.checkedAt > args.checkedAt) return null;
    if (existing) await ctx.db.patch(existing._id, args);
    else await ctx.db.insert("publicApiHealth", args);
    return null;
  },
});

/** Probe only canonical reviewed GETs, not arbitrary customer paths. */
export async function probePublicApiHealth(api: WorkspacePublicApi, request: typeof fetch = fetch) {
  let status = 0;
  try {
    const url = buildPinnedPublicApiUrl(api, api.smokePath ?? "/");
    if (!url) return { healthy: false, status };
    const response = await fetchWorkspacePublicGet(api, url, { fetch: request });
    status = response.status;
    if (!response.ok) { await response.body?.cancel(); return { healthy: false, status }; }
    const reader = response.body?.getReader();
    if (!reader) return { healthy: false, status };
    const decoder = new TextDecoder();
    let text = "", bytes = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 262_144) { await reader.cancel(); return { healthy: false, status }; }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return { healthy: decodePublicApiResponse(api, text, response.headers.get("Content-Type") ?? "").valid, status };
  } catch { return { healthy: false, status }; }
}

export const recheck = internalAction({
  args: { offset: v.optional(v.number()) },
  returns: v.object({ checked: v.number(), nextOffset: v.union(v.number(), v.null()) }),
  handler: async (ctx, { offset = 0 }): Promise<{ checked: number; nextOffset: number | null }> => {
    if (!Number.isInteger(offset) || offset < 0) throw new Error("Invalid public API batch offset");
    const batch = WORKSPACE_PUBLIC_APIS.slice(offset, offset + BATCH_SIZE);
    const locks = new Map<string, Promise<void>>();
    const lastStartedAt = new Map<string, number>();
    let next = 0;
    async function worker() {
      while (next < batch.length) {
        const api = batch[next++];
        const previous = locks.get(api.origin) ?? Promise.resolve();
        let release!: () => void;
        locks.set(api.origin, new Promise<void>((resolve) => { release = resolve; }));
        await previous;
        try {
          const wait = 1000 - (Date.now() - (lastStartedAt.get(api.origin) ?? 0));
          if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
          lastStartedAt.set(api.origin, Date.now());
          const outcome = await probePublicApiHealth(api);
          await ctx.runMutation((internal as any).publicApiHealth.record, { apiId: api.id, ...outcome, checkedAt: Date.now() });
        } finally { release(); }
      }
    }
    await Promise.all(Array.from({ length: Math.min(4, batch.length) }, worker));
    const nextOffset = offset + batch.length < WORKSPACE_PUBLIC_APIS.length ? offset + batch.length : null;
    if (nextOffset !== null) await ctx.scheduler.runAfter(0, (internal as any).publicApiHealth.recheck, { offset: nextOffset });
    return { checked: batch.length, nextOffset };
  },
});
