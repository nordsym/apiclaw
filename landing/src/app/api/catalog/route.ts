import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { isInternalCatalogEntry, isUnavailableManagedBrand } from "@/lib/provider-boundaries";
import {
  MANAGED_PROVIDER_ADAPTERS,
  MANAGED_PROVIDER_ADAPTER_COUNT,
  PUBLIC_CUSTOMER_EXECUTABLE_PROVIDER_COUNT,
  getManagedProviderAdapter,
} from "@apiclaw/product-truth";
import { CANON_STATS } from "@apiclaw/canon-stats";

interface ApiEntry {
  name: string;
  description: string;
  category: string;
  baseUrl: string;
  docsUrl: string;
  auth: string;
  pricing: string;
  callable?: boolean;
  managedAdapter?: boolean;
  providerId?: string;
  actions?: readonly string[];
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
let cachedWorkspacePublicNames: Set<string> | null = null;

function isWorkspacePublicCatalogCard(name: string | undefined): boolean {
  if (!cachedWorkspacePublicNames) {
    const paths = [
      path.join(process.cwd(), "src/lib/workspace-public-apis.json"),
      path.join(process.cwd(), "landing/src/lib/workspace-public-apis.json"),
    ];
    for (const filePath of paths) {
      try {
        const rows = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Array<{ name?: string }>;
        cachedWorkspacePublicNames = new Set(
          rows.map((row) => String(row.name || "").toLowerCase().trim()).filter(Boolean),
        );
        break;
      } catch {
        continue;
      }
    }
    if (!cachedWorkspacePublicNames) {
      throw new Error("workspace-public-apis.json is missing from the landing catalog");
    }
  }
  return typeof name === "string" && cachedWorkspacePublicNames.has(name.toLowerCase().trim());
}

function assertPublicCatalogTruth(
  apis: ApiEntry[],
  verification: VerificationStatus | null,
): void {
  const actual = {
    discoverable: apis.length,
    sourceVerified: apis.filter((api) => api.verified === true).length,
    verificationSweepPasses: verification?.buckets?.verified ?? 0,
    managedAdapters: apis.filter((api) => api.managedAdapter === true).length,
    customerExecutable: apis.filter((api) => api.callable === true).length,
  };
  const expected = {
    discoverable: CANON_STATS.discoverable,
    sourceVerified: CANON_STATS.source_verified,
    verificationSweepPasses: CANON_STATS.verification_sweep_passes,
    managedAdapters: CANON_STATS.managed_provider_adapters,
    customerExecutable: CANON_STATS.customer_executable_catalog_cards,
  };

  if (
    actual.discoverable !== expected.discoverable ||
    actual.sourceVerified !== expected.sourceVerified ||
    actual.verificationSweepPasses !== expected.verificationSweepPasses ||
    actual.managedAdapters !== expected.managedAdapters ||
    actual.customerExecutable !== expected.customerExecutable
  ) {
    throw new Error(
      `Public catalog truth drift: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}

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
  let lastError: unknown = null;

  for (const p of paths) {
    try {
      const raw = fs.readFileSync(p, "utf-8");
      const data = JSON.parse(raw);
      const all: ApiEntry[] = [...(data.apis || [])];
      if (!all.some((entry) => entry.name.toLowerCase().trim() === "e2b")) {
        all.push({
          name: "E2B",
          description: "Secure code sandboxes for AI agents",
          category: "AI & ML",
          baseUrl: "https://api.e2b.app",
          docsUrl: "https://e2b.dev/docs",
          auth: "managed",
          pricing: "freemium",
          callable: true,
        });
      }

      const publicRegistryInventory = all.filter((a) =>
          !isInternalCatalogEntry(a) &&
          !isUnavailableManagedBrand([a.name, a.baseUrl, a.docsUrl].filter(Boolean).join(" "))
        );
      const discoveryRegistryInventory = publicRegistryInventory.filter(
        (entry) => !getManagedProviderAdapter(entry.name),
      );

      const discoveryInventory = discoveryRegistryInventory
        .map((a): ApiEntry => {
          const nameLower = (a.name || "").toLowerCase().trim();

          // Exact name is the only safe mapping available in the current
          // compact evidence file. Shared spec-host fallback is prohibited.
          const v: VerificationEntry | undefined =
            (nameLower && verification?.by_name_lower?.[nameLower]) || undefined;

          let tier: ApiEntry["tier"];
          let verified = false;
          const workspacePublic = isWorkspacePublicCatalogCard(a.name);
          // Harvested apiKey/unknown rows stay discovery-only. Only the
          // workspace-authenticated public/no-key allowlist is callable.
          let callable = workspacePublic;

          if (v) {
            tier = v.tier;
            verified = v.tier === "verified";
            if (workspacePublic) tier = "working";
          } else {
            if (workspacePublic) tier = "working";
            else if (a.callable === true) tier = "untested";
          }

          return {
            ...a,
            callable,
            managedAdapter: false,
            tier,
            verified,
            latency_ms: v?.latency_ms ?? null,
            last_verified_at: v?.last_verified_at ?? null,
          };
        });

      // Replace registry aliases with one canonical card per managed adapter.
      const managedAdapterInventory = MANAGED_PROVIDER_ADAPTERS.map(
        (provider): ApiEntry => ({
          name: provider.name,
          description: provider.description,
          category: provider.category,
          baseUrl: provider.baseUrl,
          docsUrl: provider.docsUrl,
          auth: "managed",
          pricing: provider.pricing,
          callable: provider.customerExecutableActions.length > 0,
          managedAdapter: true,
          providerId: provider.id,
          actions: provider.customerExecutableActions,
          tier: provider.customerExecutableActions.length > 0 ? "managed" : "untested",
          // Executable is a separate, stronger runtime property. It is not
          // evidence that this catalog card passed the source sweep.
          verified: false,
          latency_ms: null,
          last_verified_at: null,
        }),
      );

      cachedApis = [...managedAdapterInventory, ...discoveryInventory];
      assertPublicCatalogTruth(cachedApis, verification);
      return cachedApis!;
    } catch (error) {
      lastError = error;
      continue;
    }
  }

  if (lastError instanceof Error) throw lastError;
  throw new Error("Public catalog inventory is unavailable");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.toLowerCase() || "";
  const category = searchParams.get("category") || "";
  const callableOnly = searchParams.get("callable") === "true";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "60", 10), 100);

  const apis = loadApis();
  const tierFilter = searchParams.get("tier") || ""; // callable | adapter | verified | discovery

  let filtered = apis;

  if (tierFilter === "managed" || tierFilter === "callable" || callableOnly) {
    filtered = filtered.filter((a) => a.callable === true);
  } else if (tierFilter === "adapter") {
    filtered = filtered.filter((a) => a.managedAdapter === true);
  } else if (tierFilter === "verified") {
    filtered = filtered.filter((a) => a.verified === true);
  } else if (tierFilter === "discovery") {
    filtered = filtered.filter((a) => a.managedAdapter !== true && a.verified !== true);
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
  const categories: Record<string, { total: number; callable: number; verified: number; managedAdapters: number }> = {};
  for (const a of apis) {
    if (!categories[a.category]) {
      categories[a.category] = { total: 0, callable: 0, verified: 0, managedAdapters: 0 };
    }
    categories[a.category].total += 1;
    if (a.callable) categories[a.category].callable += 1;
    if (a.verified) categories[a.category].verified += 1;
    if (a.managedAdapter) categories[a.category].managedAdapters += 1;
  }

  const totalCallable = apis.filter((api) => api.callable).length;
  const totalVerified = apis.filter((api) => api.verified).length;
  const totalDiscoveryOnly = apis.filter(
    (api) => api.managedAdapter !== true && api.verified !== true,
  ).length;
  return NextResponse.json({
    items,
    total,
    totalDiscoverable: apis.length,
    page,
    limit,
    hasMore,
    categories,
    totalCallable,
    totalCustomerExecutable: totalCallable,
    totalVerified,
    sourceVerifiedCount: totalVerified,
    discoveryOnlyCount: totalDiscoveryOnly,
    managedProviderAdapterCount: MANAGED_PROVIDER_ADAPTER_COUNT,
    customerExecutableProviderCount: PUBLIC_CUSTOMER_EXECUTABLE_PROVIDER_COUNT,
    canonGeneratedAt: CANON_STATS.generated_at,
  });
}
