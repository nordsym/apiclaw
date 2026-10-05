import { v } from "convex/values";
export const listingMetadata = v.object({
  name: v.string(),
  description: v.string(),
  category: v.string(),
  docsUrl: v.string(),
  baseUrl: v.string(),
  specUrl: v.optional(v.string()),
  auth: v.string(),
  pricing: v.string(),
  pricingNotes: v.string(),
  operations: v.array(
    v.object({ method: v.string(), path: v.string(), summary: v.string() }),
  ),
});
export type ListingMetadata = {
  name: string;
  description: string;
  category: string;
  docsUrl: string;
  baseUrl: string;
  specUrl?: string;
  auth: string;
  pricing: string;
  pricingNotes: string;
  operations: { method: string; path: string; summary: string }[];
};
export function validateListing(m: ListingMetadata) {
  for (const [key, max] of Object.entries({
    name: 120,
    description: 2000,
    category: 80,
    auth: 300,
    pricing: 80,
    pricingNotes: 1000,
  })) {
    const value = m[key as keyof ListingMetadata];
    if (typeof value !== "string" || !value.trim() || value.length > max)
      throw Error(`Invalid ${key}`);
  }
  for (const value of [
    m.docsUrl,
    m.baseUrl,
    ...(m.specUrl ? [m.specUrl] : []),
  ]) {
    const u = new URL(value);
    if (
      value.length > 2048 ||
      u.protocol !== "https:" ||
      u.username ||
      u.password ||
      u.search ||
      u.hash
    )
      throw Error(
        "Use public HTTPS URLs without credentials, queries or fragments",
      );
  }
  if (!m.operations.length || m.operations.length > 200)
    throw Error("Provide 1 to 200 operations");
  for (const op of m.operations)
    if (
      !/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/.test(op.method) ||
      !op.path.startsWith("/") ||
      op.path.length > 500 ||
      op.summary.length > 300
    )
      throw Error("Invalid operation");
}
export function listingCard(id: string, m: ListingMetadata) {
  return {
    name: m.name,
    description: m.description,
    category: m.category,
    baseUrl: m.baseUrl,
    docsUrl: m.docsUrl,
    auth: m.auth,
    pricing: m.pricing,
    pricingNotes: m.pricingNotes,
    operations: m.operations,
    listingId: id,
    providerId: `listing:${id}`,
    callable: false,
    managedAdapter: false,
    verified: false,
    executionAvailable: false,
    tier: "untested" as const,
  };
}
