const INTERNAL_PROVIDER_PATTERN = /(^|[^a-z0-9])(46elks|twilio|resend)([^a-z0-9]|$)/i;
const UNAVAILABLE_MANAGED_PATTERN = /(^|[^a-z0-9])(together(?: ai)?|deepgram|assemblyai|replicate|stability(?: ai)?|e2b)([^a-z0-9]|$)/i;

type CatalogReference = {
  name?: string;
  id?: string;
  baseUrl?: string;
  docsUrl?: string;
};

function referenceMatches(reference: CatalogReference, pattern: RegExp): boolean {
  return [reference.name, reference.id, reference.baseUrl, reference.docsUrl]
    .some((value) => typeof value === "string" && pattern.test(value));
}

export function isInternalCatalogEntry(reference: CatalogReference): boolean {
  return referenceMatches(reference, INTERNAL_PROVIDER_PATTERN);
}

export function isUnavailableManagedBrand(name: string | undefined): boolean {
  return typeof name === "string" && UNAVAILABLE_MANAGED_PATTERN.test(name);
}
