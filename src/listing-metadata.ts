/** Dependency-free discovery metadata shared by the web UI and Convex. */
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
