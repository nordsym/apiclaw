import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { isInternalCatalogEntry, isUnavailableManagedBrand } from "@/lib/provider-boundaries";

interface ApiEntry {
  name: string;
  description: string;
  category: string;
  baseUrl: string;
  docsUrl: string;
  auth: string;
  pricing: string;
  callable?: boolean;
  // Enriched from verification-status.json
  verified?: boolean;
  tier?: "managed" | "verified" | "working" | "needs_ctx" | "auth" | "dead" | "untested";
  latency_ms?: number | null;
  last_verified_at?: string | null;
}

interface VerificationEntry {
  tier: "verified" | "working" | "auth" | "needs_ctx" | "dead";
  classification: string;
  latency_ms: number | null;
  body_size: number | null;
  status: number;
  last_verified_at: string;
  action: string;
}

interface VerificationStatus {
  buckets: Record<string, number>;
  by_id: Record<string, VerificationEntry>;
  by_name_lower: Record<string, VerificationEntry>;
  by_host?: Record<string, VerificationEntry>;
}

// Canon managed-provider brand names (lowercase). Must stay in sync with
// scripts/clean-registry-flags.mjs. APIClaw owns the keys for these and the
// registry's auth field is unreliable (often "apiKey" even when we proxy
// with our own credentials), so we identify them by name match — including
// "{brand} api" variants since the registry sometimes has those.
// NOTE: This allowlist auto-promotes any registry row whose brand starts with these
// names to tier:"managed", verified:true, callable:true. As of 2026-05-08 some
// APILayer sub-APIs (Skills, Number Verification, World News, Image Crop, Form) are
// upstream-blocked despite being managed. Per-action status lives in
// providerDirectCall + APILAYER_SUBSCRIPTION_BLOCKED_NAMES; this allowlist is
// brand-level only.
const MANAGED_BRAND_NAMES = new Set([
  "openai", "openai api",
  "anthropic", "anthropic api", "anthropic claude", "anthropic messages api",
  "openrouter", "openrouter api",
  "x.ai", "x.ai api", "xai api", "grok", "grok api",
  "brave search", "brave search ai",
  "elevenlabs", "elevenlabs api", "elevenlabs tts",
  "replicate", "replicate api",
  "firecrawl", "firecrawl api",
  "e2b", "e2b api",
  "groq", "groq api",
  "deepgram", "deepgram api",
  "serper", "serper api",
  "mistral", "mistral ai", "mistral api", "mistral ai api",
  "cohere", "cohere api",
  "together", "together ai", "together ai api", "together apis",
  "stability", "stability ai", "stability ai api",
  "assemblyai", "assemblyai api",
  "github", "github api",
  "apilayer",
]);

function hostFromUrl(u: string): string | null {
  try {
    return new URL(u).host.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

let cachedApis: ApiEntry[] | null = null;
let cachedVerification: VerificationStatus | null = null;

function loadVerification(): VerificationStatus | null {
  if (cachedVerification) return cachedVerification;
  const paths = [
    path.join(process.cwd(), "src/lib/verification-status.json"),
    path.join(process.cwd(), "landing/src/lib/verification-status.json"),
  ];
  for (const p of paths) {
    try {
      const raw = fs.readFileSync(p, "utf-8");
      cachedVerification = JSON.parse(raw) as VerificationStatus;
      return cachedVerification;
    } catch {
      continue;
    }
  }
  return null;
}

function tierRank(tier: string | undefined): number {
  // Higher = better. Used for default sort.
  switch (tier) {
    case "managed": return 1000;
    case "verified": return 800;
    case "working": return 600;
    case "needs_ctx": return 400;
    case "auth": return 300;
    case "untested": return 200;
    case "dead": return 50;
    default: return 100;
  }
}

function loadApis(): ApiEntry[] {
  if (cachedApis) return cachedApis;

  const paths = [
    path.join(process.cwd(), "../src/registry/apis.json"),
    path.join(process.cwd(), "src/lib/apis.json"),
  ];

  const verification = loadVerification();

  for (const p of paths) {
    try {
      const raw = fs.readFileSync(p, "utf-8");
      const data = JSON.parse(raw);
      const all: ApiEntry[] = data.apis || [];

      const enriched = all
        .filter((a) => !isInternalCatalogEntry(a))
        .map((a): ApiEntry => {
          const nameLower = (a.name || "").toLowerCase().trim();
          const isManagedByAuth = (a.auth || "").toLowerCase() === "managed";
          const isManagedByName = MANAGED_BRAND_NAMES.has(nameLower);
          const isUnavailableManaged = isUnavailableManagedBrand(nameLower);
          const isManaged = (isManagedByAuth || isManagedByName) && !isUnavailableManaged;

          // Verification join: try name first, then host fallback.
          let v: VerificationEntry | undefined =
            (nameLower && verification?.by_name_lower?.[nameLower]) || undefined;
          if (!v) {
            const host = hostFromUrl(a.baseUrl || "");
            if (host && verification?.by_host?.[host]) {
              v = verification.by_host[host];
            }
          }

          let tier: ApiEntry["tier"];
          let verified = false;
          let callable = a.callable === true;

          if (isUnavailableManaged) {
            tier = "auth";
            verified = false;
            callable = false;
          } else if (isManaged) {
            tier = "managed";
            verified = true;
            callable = true;
          } else if (v) {
            tier = v.tier;
            verified = v.tier === "verified";
            // Honest measurement: only verified providers count as callable.
            // Working_other, auth, needs_ctx, dead all drop to discovery.
            callable = v.tier === "verified";
          } else {
            // No verification result and not managed → demoted to discovery,
            // regardless of any stale registry callable flag. Honest count.
            callable = false;
            if (a.callable === true) tier = "untested";
          }

          return {
            ...a,
            callable,
            tier,
            verified,
            latency_ms: v?.latency_ms ?? null,
            last_verified_at: v?.last_verified_at ?? null,
          };
        });

      cachedApis = enriched;
      return cachedApis!;
    } catch {
      continue;
    }
  }

  cachedApis = [];
  return cachedApis;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.toLowerCase() || "";
  const category = searchParams.get("category") || "";
  const callableOnly = searchParams.get("callable") === "true";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "60", 10), 100);

  const apis = loadApis();
  const tierFilter = searchParams.get("tier") || ""; // managed | verified | callable | discovery

  let filtered = apis;

  if (tierFilter === "managed") {
    filtered = filtered.filter((a) => a.tier === "managed");
  } else if (tierFilter === "verified") {
    filtered = filtered.filter((a) => a.verified === true);
  } else if (tierFilter === "callable" || callableOnly) {
    filtered = filtered.filter((a) => a.callable);
  } else if (tierFilter === "discovery") {
    filtered = filtered.filter((a) => !a.callable);
  }

  if (category) {
    filtered = filtered.filter((a) => a.category === category);
  }

  if (query) {
    filtered = filtered.filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query)
    );
  }

  // Sort: tier rank desc, then latency asc, then name asc.
  filtered = [...filtered].sort((a, b) => {
    const t = tierRank(b.tier) - tierRank(a.tier);
    if (t !== 0) return t;
    const al = a.latency_ms ?? 99_999;
    const bl = b.latency_ms ?? 99_999;
    if (al !== bl) return al - bl;
    return (a.name || "").localeCompare(b.name || "");
  });

  const total = filtered.length;
  const offset = (page - 1) * limit;
  const items = filtered.slice(offset, offset + limit);
  const hasMore = offset + limit < total;

  // Category counts with callable + verified breakdown
  const categories: Record<string, { total: number; callable: number; verified: number }> = {};
  for (const a of apis) {
    if (!categories[a.category]) {
      categories[a.category] = { total: 0, callable: 0, verified: 0 };
    }
    categories[a.category].total += 1;
    if (a.callable) categories[a.category].callable += 1;
    if (a.verified) categories[a.category].verified += 1;
  }

  const totalCallable = apis.filter((api) => api.callable).length;
  return NextResponse.json({
    items,
    total,
    totalDiscoverable: apis.length,
    page,
    limit,
    hasMore,
    categories,
    totalCallable,
  });
}
