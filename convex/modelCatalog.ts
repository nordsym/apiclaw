/**
 * Model Catalog — single source of truth for /v1/models.
 *
 * Architecture:
 *   1. internal.modelCatalog.refresh (action, called by 6h cron + on-demand)
 *      → pulls /models from each managed provider in parallel
 *      → normalizes to canonical apiclaw-routable IDs (e.g. "openai/gpt-4o")
 *      → upserts to `modelCatalog` table
 *      → marks rows not seen for >24h as deprecated:true
 *   2. internal.modelCatalog.list (query, used by /v1/models HTTP handler)
 *   3. internal.modelCatalog.upsertOne (mutation, used by refresh action)
 *   4. internal.modelCatalog.markStale (mutation, end-of-refresh sweep)
 *
 * Provider keys live in Convex env (see `npx convex env list --prod`).
 * Anthropic key is deliberately NOT set (per Gustav 2026-04-17) — Claude routes via OpenRouter markup.
 * For Anthropic we use a hardcoded fallback list (canonical model IDs published by Anthropic).
 */

import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

// ============================================================
// Types
// ============================================================

type Entry = {
  id: string;
  ownedBy: string;
  via: "direct" | "openrouter" | "managed-fallback";
  endpoint: "/v1/chat/completions" | "/v1/embeddings" | "/v1/messages";
  name?: string;
  contextWindow?: number;
  inputModalities?: string[];
  source: string;
};

// ============================================================
// Classifiers
// ============================================================

function classifyEndpoint(id: string, ownedBy: string, name?: string): Entry["endpoint"] | null {
  const blob = `${id} ${name ?? ""}`.toLowerCase();
  // exclude non-LLM
  if (/whisper|tts|audio-|transcrib|voice-|realtime/.test(blob)) return null;
  if (/dall-e|sdxl|stable-diffusion|flux|imagen|midjourney/.test(blob)) return null;
  if (/moderation/.test(blob)) return null;
  if (/embed|embedding/.test(blob)) return "/v1/embeddings";
  // anthropic-native models also surface on /v1/messages (PR2); /v1/chat/completions still works via translator
  if (ownedBy === "anthropic") return "/v1/chat/completions";
  return "/v1/chat/completions";
}

function humanName(id: string): string {
  const last = id.split("/").pop() || id;
  return last
    .split(/[-_:.]/)
    .filter(Boolean)
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

function inferOwnedBy(id: string): string {
  if (id.includes("/")) return id.split("/", 1)[0];
  if (/^gpt-|^o[1-9]|^chatgpt-|^codex-/.test(id)) return "openai";
  if (/^claude-/.test(id)) return "anthropic";
  if (/^gemini-|^text-bison|^chat-bison/.test(id)) return "google";
  if (/^grok-/.test(id)) return "xai";
  if (/^llama-|^llama3|^llama-3/.test(id)) return "meta";
  if (/^mistral|^codestral|^mixtral|^pixtral|^ministral/.test(id)) return "mistral";
  if (/^command-|^cohere-/.test(id)) return "cohere";
  if (/^deepseek-/.test(id)) return "deepseek";
  if (/^kimi-|^moonshot/.test(id)) return "moonshotai";
  if (/^qwen-/.test(id)) return "qwen";
  return "unknown";
}

// ============================================================
// Provider fetchers — each returns Entry[] or [] on failure
// ============================================================

async function safe<T>(label: string, fn: () => Promise<T[]>): Promise<T[]> {
  try {
    const out = await fn();
    console.log(`[modelCatalog] ${label} → ${out.length} entries`);
    return out;
  } catch (e: any) {
    console.warn(`[modelCatalog] ${label} FAILED: ${e?.message ?? e}`);
    return [];
  }
}

async function fetchJson(url: string, init: RequestInit = {}, timeoutMs = 15_000): Promise<any> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function pullOpenAI(key?: string): Promise<Entry[]> {
  if (!key) return [];
  const json = await fetchJson("https://api.openai.com/v1/models", { headers: { Authorization: `Bearer ${key}` } });
  const out: Entry[] = [];
  for (const m of json.data ?? []) {
    const id = `openai/${m.id}`;
    const ep = classifyEndpoint(id, "openai", m.id);
    if (!ep) continue;
    out.push({ id, ownedBy: "openai", via: "direct", endpoint: ep, name: humanName(m.id), source: "openai" });
  }
  return out;
}

async function pullXai(key?: string): Promise<Entry[]> {
  if (!key) return [];
  const json = await fetchJson("https://api.x.ai/v1/models", { headers: { Authorization: `Bearer ${key}` } });
  const out: Entry[] = [];
  for (const m of json.data ?? []) {
    const id = `x-ai/${m.id}`;
    const ep = classifyEndpoint(id, "xai", m.id);
    if (!ep) continue;
    out.push({ id, ownedBy: "xai", via: "direct", endpoint: ep, name: humanName(m.id), source: "xai" });
  }
  return out;
}

async function pullGroq(key?: string): Promise<Entry[]> {
  if (!key) return [];
  const json = await fetchJson("https://api.groq.com/openai/v1/models", { headers: { Authorization: `Bearer ${key}` } });
  const out: Entry[] = [];
  for (const m of json.data ?? []) {
    const id = `groq/${m.id}`;
    const ep = classifyEndpoint(id, "groq", m.id);
    if (!ep) continue;
    const e: Entry = { id, ownedBy: "groq", via: "direct", endpoint: ep, name: humanName(m.id), source: "groq" };
    if (typeof m.context_window === "number") e.contextWindow = m.context_window;
    out.push(e);
  }
  return out;
}

async function pullMistral(key?: string): Promise<Entry[]> {
  if (!key) return [];
  const json = await fetchJson("https://api.mistral.ai/v1/models", { headers: { Authorization: `Bearer ${key}` } });
  const out: Entry[] = [];
  for (const m of json.data ?? []) {
    const id = `mistralai/${m.id}`;
    const ep = classifyEndpoint(id, "mistral", m.id);
    if (!ep) continue;
    const e: Entry = { id, ownedBy: "mistral", via: "direct", endpoint: ep, name: humanName(m.id), source: "mistral" };
    if (typeof m.max_context_length === "number") e.contextWindow = m.max_context_length;
    out.push(e);
  }
  return out;
}

async function pullCohere(key?: string): Promise<Entry[]> {
  if (!key) return [];
  const json = await fetchJson("https://api.cohere.com/v1/models?page_size=200", { headers: { Authorization: `Bearer ${key}` } });
  const out: Entry[] = [];
  for (const m of json.models ?? []) {
    const id = `cohere/${m.name}`;
    const ep = classifyEndpoint(id, "cohere", m.name);
    if (!ep) continue;
    const e: Entry = { id, ownedBy: "cohere", via: "direct", endpoint: ep, name: humanName(m.name), source: "cohere" };
    if (typeof m.context_length === "number") e.contextWindow = m.context_length;
    out.push(e);
  }
  return out;
}

async function pullOpenRouter(key?: string): Promise<Entry[]> {
  // OpenRouter /models is open (no auth required) but keyed calls get higher rate limits
  const headers: Record<string, string> = {};
  if (key) headers.Authorization = `Bearer ${key}`;
  const json = await fetchJson("https://openrouter.ai/api/v1/models", { headers });
  const out: Entry[] = [];
  for (const m of json.data ?? []) {
    const id: string = m.id;
    const ownedBy = id.includes("/") ? id.split("/", 1)[0] : inferOwnedBy(id);
    const ep = classifyEndpoint(id, ownedBy, m.name);
    if (!ep) continue;
    const e: Entry = {
      id,
      ownedBy,
      via: "openrouter",
      endpoint: ep,
      name: (m.name || humanName(id)).replace(/^[^:]+:\s*/, ""),
      source: "openrouter",
    };
    if (typeof m.context_length === "number" && m.context_length > 0) e.contextWindow = m.context_length;
    const modal = ((m.architecture?.input_modalities || m.architecture?.modality) ?? []).toString();
    const inputModalities = ["text"];
    if (/image/i.test(modal)) inputModalities.push("image");
    if (/audio/i.test(modal)) inputModalities.push("audio");
    e.inputModalities = inputModalities;
    out.push(e);
  }
  return out;
}

async function pullAnthropic(key?: string): Promise<Entry[]> {
  if (!key) return [];
  const json = await fetchJson("https://api.anthropic.com/v1/models", {
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
  });
  const out: Entry[] = [];
  for (const m of json.data ?? []) {
    const id = `anthropic/${m.id}`;
    const ep = classifyEndpoint(id, "anthropic", m.display_name || m.id);
    if (!ep) continue;
    out.push({
      id,
      ownedBy: "anthropic",
      via: "direct",
      endpoint: ep,
      name: m.display_name || humanName(m.id),
      contextWindow: 200_000,
      inputModalities: ["text", "image"],
      source: "anthropic",
    });
  }
  return out;
}

async function pullDeepInfra(key?: string): Promise<Entry[]> {
  if (!key) return [];
  const json = await fetchJson("https://api.deepinfra.com/v1/openai/models", { headers: { Authorization: `Bearer ${key}` } });
  const out: Entry[] = [];
  for (const m of json.data ?? []) {
    const id = m.id.includes("/") ? m.id : `deepinfra/${m.id}`;
    const ownedBy = id.split("/", 1)[0];
    const ep = classifyEndpoint(id, ownedBy, m.id);
    if (!ep) continue;
    out.push({ id, ownedBy, via: "direct", endpoint: ep, name: humanName(m.id), source: "deepinfra" });
  }
  return out;
}

// Anthropic hardcoded fallback — canonical IDs published by Anthropic.
// Updated 2026-05-15. Refresh whenever Anthropic ships new flagships.
const ANTHROPIC_HARDCODED: Entry[] = [
  { id: "anthropic/claude-opus-4-6", ownedBy: "anthropic", via: "direct", endpoint: "/v1/chat/completions", name: "Claude Opus 4.6", contextWindow: 200_000, inputModalities: ["text", "image"], source: "anthropic-hardcoded" },
  { id: "anthropic/claude-sonnet-4-6", ownedBy: "anthropic", via: "direct", endpoint: "/v1/chat/completions", name: "Claude Sonnet 4.6", contextWindow: 1_000_000, inputModalities: ["text", "image"], source: "anthropic-hardcoded" },
  { id: "anthropic/claude-haiku-4-5", ownedBy: "anthropic", via: "direct", endpoint: "/v1/chat/completions", name: "Claude Haiku 4.5", contextWindow: 200_000, inputModalities: ["text", "image"], source: "anthropic-hardcoded" },
  { id: "anthropic/claude-3.5-sonnet", ownedBy: "anthropic", via: "direct", endpoint: "/v1/chat/completions", name: "Claude 3.5 Sonnet", contextWindow: 200_000, inputModalities: ["text", "image"], source: "anthropic-hardcoded" },
  { id: "anthropic/claude-3.5-haiku", ownedBy: "anthropic", via: "direct", endpoint: "/v1/chat/completions", name: "Claude 3.5 Haiku", contextWindow: 200_000, inputModalities: ["text"], source: "anthropic-hardcoded" },
];

// Voyage embedding hardcoded (no public /models endpoint).
const VOYAGE_HARDCODED: Entry[] = [
  { id: "voyage/voyage-3-large", ownedBy: "voyage", via: "direct", endpoint: "/v1/embeddings", name: "Voyage 3 Large", source: "voyage-hardcoded" },
  { id: "voyage/voyage-3", ownedBy: "voyage", via: "direct", endpoint: "/v1/embeddings", name: "Voyage 3", source: "voyage-hardcoded" },
  { id: "voyage/voyage-3-lite", ownedBy: "voyage", via: "direct", endpoint: "/v1/embeddings", name: "Voyage 3 Lite", source: "voyage-hardcoded" },
  { id: "voyage/voyage-code-3", ownedBy: "voyage", via: "direct", endpoint: "/v1/embeddings", name: "Voyage Code 3", source: "voyage-hardcoded" },
  { id: "voyage/voyage-multilingual-2", ownedBy: "voyage", via: "direct", endpoint: "/v1/embeddings", name: "Voyage Multilingual 2", source: "voyage-hardcoded" },
];

// ============================================================
// Refresh action (called by cron + on-demand)
// ============================================================

export const refresh = internalAction({
  args: { force: v.optional(v.boolean()) },
  handler: async (ctx, _args) => {
    const startedAt = Date.now();

    const [openai, anthropic, xai, groq, mistral, cohere, openrouter, deepinfra] = await Promise.all([
      safe("openai", () => pullOpenAI(process.env.OPENAI_API_KEY)),
      safe("anthropic", () => pullAnthropic(process.env.ANTHROPIC_API_KEY)),
      safe("xai", () => pullXai(process.env.XAI_API_KEY)),
      safe("groq", () => pullGroq(process.env.GROQ_API_KEY)),
      safe("mistral", () => pullMistral(process.env.MISTRAL_API_KEY)),
      safe("cohere", () => pullCohere(process.env.COHERE_API_KEY)),
      safe("openrouter", () => pullOpenRouter(process.env.OPENROUTER_API_KEY)),
      safe("deepinfra", () => pullDeepInfra(process.env.DEEPINFRA_API_KEY)),
    ]);

    // Anthropic hardcoded list is only used if live pull failed (no key, downtime, etc.).
    const anthropicEntries = anthropic.length > 0 ? anthropic : ANTHROPIC_HARDCODED;

    const all: Entry[] = [
      ...openai,
      ...anthropicEntries,
      ...xai,
      ...groq,
      ...mistral,
      ...cohere,
      ...openrouter,
      ...deepinfra,
      ...VOYAGE_HARDCODED,
    ];

    // dedupe: prefer "direct" over "openrouter" for same id
    const byId = new Map<string, Entry>();
    for (const e of all) {
      const existing = byId.get(e.id);
      if (!existing) {
        byId.set(e.id, e);
        continue;
      }
      // direct beats openrouter
      if (existing.via === "openrouter" && e.via === "direct") byId.set(e.id, e);
    }

    // upsert
    let upserted = 0;
    for (const e of byId.values()) {
      await ctx.runMutation(internal.modelCatalog.upsertOne, { entry: e });
      upserted++;
    }

    // mark stale (not seen this run) as deprecated
    const stale = await ctx.runMutation(internal.modelCatalog.markStale, { cutoff: startedAt - 60_000 });

    const elapsed = Date.now() - startedAt;
    console.log(`[modelCatalog] refresh complete: ${upserted} upserted, ${stale} marked deprecated, elapsed=${elapsed}ms`);

    return { upserted, deprecated: stale, elapsedMs: elapsed };
  },
});

// ============================================================
// Mutations
// ============================================================

export const upsertOne = internalMutation({
  args: {
    entry: v.object({
      id: v.string(),
      ownedBy: v.string(),
      via: v.string(),
      endpoint: v.string(),
      name: v.optional(v.string()),
      contextWindow: v.optional(v.number()),
      inputModalities: v.optional(v.array(v.string())),
      source: v.string(),
    }),
  },
  handler: async (ctx, { entry }) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("modelCatalog")
      .withIndex("by_canonical_id", (q) => q.eq("id", entry.id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ownedBy: entry.ownedBy,
        via: entry.via,
        endpoint: entry.endpoint,
        ...(entry.name !== undefined ? { name: entry.name } : {}),
        ...(entry.contextWindow !== undefined ? { contextWindow: entry.contextWindow } : {}),
        ...(entry.inputModalities !== undefined ? { inputModalities: entry.inputModalities } : {}),
        source: entry.source,
        deprecated: false,
        lastSeenAt: now,
      });
      return existing._id;
    }
    return await ctx.db.insert("modelCatalog", {
      ...entry,
      firstSeenAt: now,
      lastSeenAt: now,
      deprecated: false,
    });
  },
});

export const markStale = internalMutation({
  args: { cutoff: v.number() },
  handler: async (ctx, { cutoff }) => {
    const stale = await ctx.db
      .query("modelCatalog")
      .withIndex("by_lastSeenAt", (q) => q.lt("lastSeenAt", cutoff))
      .collect();
    let count = 0;
    for (const row of stale) {
      if (row.deprecated) continue;
      await ctx.db.patch(row._id, { deprecated: true });
      count++;
    }
    return count;
  },
});

// ============================================================
// Queries (used by HTTP handler)
// ============================================================

export const list = internalQuery({
  args: {
    endpoint: v.optional(v.string()),
    ownedBy: v.optional(v.string()),
    includeDeprecated: v.optional(v.boolean()),
  },
  handler: async (ctx, { endpoint, ownedBy, includeDeprecated }) => {
    let q;
    if (endpoint) {
      q = ctx.db.query("modelCatalog").withIndex("by_endpoint", (i) => i.eq("endpoint", endpoint));
    } else if (ownedBy) {
      q = ctx.db.query("modelCatalog").withIndex("by_ownedBy", (i) => i.eq("ownedBy", ownedBy));
    } else {
      q = ctx.db.query("modelCatalog");
    }
    const rows = await q.collect();
    return rows
      .filter((r) => includeDeprecated || !r.deprecated)
      .filter((r) => !ownedBy || r.ownedBy === ownedBy)
      .filter((r) => !endpoint || r.endpoint === endpoint);
  },
});

export const stats = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("modelCatalog").collect();
    const active = rows.filter((r) => !r.deprecated);
    const counts: Record<string, number> = {};
    for (const r of active) counts[r.ownedBy] = (counts[r.ownedBy] ?? 0) + 1;
    const viaCount: Record<string, number> = {};
    for (const r of active) viaCount[r.via] = (viaCount[r.via] ?? 0) + 1;
    const lastSeen = active.reduce((m, r) => Math.max(m, r.lastSeenAt), 0);
    return {
      total: rows.length,
      active: active.length,
      deprecated: rows.length - active.length,
      byOwner: counts,
      byVia: viaCount,
      lastSeenAt: lastSeen,
    };
  },
});
