import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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
}

let cachedApis: ApiEntry[] | null = null;
let cachedVerification: VerificationStatus | null = null;

// Providers that are reserved for APIClaw / NordSym internal infrastructure
// (booking confirmations, magic links, OTP). They must not appear in the
// public catalog and are blocked at the gateway for non-internal callers.
const INTERNAL_ONLY_PROVIDERS = new Set(["twilio", "46elks", "resend"]);

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
        .filter((a) => !INTERNAL_ONLY_PROVIDERS.has((a.name || "").toLowerCase()))
        .map((a): ApiEntry => {
          const isManaged = (a.auth || "").toLowerCase() === "managed";
          const v = verification?.by_name_lower?.[(a.name || "").toLowerCase()];
          let tier: ApiEntry["tier"];
          let verified = false;
          let callable = a.callable === true;

          if (isManaged) {
            tier = "managed";
            verified = true;
            callable = true;
          } else if (v) {
            tier = v.tier;
            verified = v.tier === "verified";
            // Re-derive runtime callable from verification rather than the
            // stale registry flag. verified + working count as callable; the
            // rest don't (auth-required hides credentials, dead is dead).
            callable = v.tier === "verified" || v.tier === "working";
          } else if (callable) {
            tier = "untested";
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

  const totalCallable = apis.filter((a) => a.callable).length;
  const totalVerified = apis.filter((a) => a.verified).length;
  const totalManaged = apis.filter((a) => a.tier === "managed").length;

  return NextResponse.json({
    items,
    total,
    page,
    limit,
    hasMore,
    categories,
    totalCallable,
    totalVerified,
    totalManaged,
  });
}
