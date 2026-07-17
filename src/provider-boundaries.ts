export const INTERNAL_ONLY_PROVIDER_IDS = ["46elks", "twilio", "resend"] as const;
export const UNAVAILABLE_PUBLIC_MANAGED_PROVIDER_IDS = [
  "together",
  "assemblyai",
] as const;

const INTERNAL_PROVIDER_PATTERN = /(^|[^a-z0-9])(46elks|twilio|resend)([^a-z0-9]|$)/i;
const UNAVAILABLE_MANAGED_PATTERN = /(^|[^a-z0-9])(together(?: ai)?|assemblyai)([^a-z0-9]|$)/i;

export function isInternalOnlyProvider(value: string | undefined | null): boolean {
  return typeof value === "string" && INTERNAL_PROVIDER_PATTERN.test(value.trim());
}

export function isInternalProviderReference(reference: {
  name?: string;
  id?: string;
  baseUrl?: string;
  docsUrl?: string;
}): boolean {
  return [reference.name, reference.id, reference.baseUrl, reference.docsUrl]
    .some((value) => isInternalOnlyProvider(value));
}

export function isUnavailableManagedProvider(value: string | undefined | null): boolean {
  return typeof value === "string" && UNAVAILABLE_MANAGED_PATTERN.test(value.trim());
}

export function filterPublicConnectedProviders<T extends { provider: string }>(providers: T[]): T[] {
  return providers.filter((entry) =>
    !isInternalOnlyProvider(entry.provider) && !isUnavailableManagedProvider(entry.provider)
  );
}
