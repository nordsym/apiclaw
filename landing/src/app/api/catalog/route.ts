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
}

let cachedApis: ApiEntry[] | null = null;

// Providers that are reserved for APIClaw / NordSym internal infrastructure
// (booking confirmations, magic links, OTP). They must not appear in the
// public catalog and are blocked at the gateway for non-internal callers.
const INTERNAL_ONLY_PROVIDERS = new Set(["twilio", "46elks", "resend"]);

function loadApis(): ApiEntry[] {
  if (cachedApis) return cachedApis;

  const paths = [
    path.join(process.cwd(), "../src/registry/apis.json"),
    path.join(process.cwd(), "src/lib/apis.json"),
  ];

  for (const p of paths) {
    try {
      const raw = fs.readFileSync(p, "utf-8");
      const data = JSON.parse(raw);
      const all: ApiEntry[] = data.apis || [];
      cachedApis = all.filter(
        (a) => !INTERNAL_ONLY_PROVIDERS.has((a.name || "").toLowerCase()),
      );
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

  let filtered = apis;

  if (callableOnly) {
    filtered = filtered.filter((a) => a.callable);
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

  const total = filtered.length;
  const offset = (page - 1) * limit;
  const items = filtered.slice(offset, offset + limit);
  const hasMore = offset + limit < total;

  // Category counts with callable breakdown
  const categories: Record<string, { total: number; callable: number }> = {};
  for (const a of apis) {
    if (!categories[a.category]) {
      categories[a.category] = { total: 0, callable: 0 };
    }
    categories[a.category].total += 1;
    if (a.callable) {
      categories[a.category].callable += 1;
    }
  }

  const totalCallable = apis.filter((a) => a.callable).length;

  return NextResponse.json({
    items,
    total,
    page,
    limit,
    hasMore,
    categories,
    totalCallable,
  });
}
