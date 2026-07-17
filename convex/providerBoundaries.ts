export const INTERNAL_ONLY_PROVIDER_IDS = ["46elks", "twilio", "resend"] as const;
export const UNAVAILABLE_MANAGED_PROVIDER_IDS = [
  "together",
  "assemblyai",
] as const;

const INTERNAL_PROVIDER_PATTERN = /(^|[^a-z0-9])(46elks|twilio|resend)([^a-z0-9]|$)/i;
const UNAVAILABLE_MANAGED_PATTERN = /(^|[^a-z0-9])(together(?: ai)?|assemblyai)([^a-z0-9]|$)/i;

export function isInternalProviderReference(value: string | undefined | null): boolean {
  return typeof value === "string" && INTERNAL_PROVIDER_PATTERN.test(value);
}

export function isPubliclyAvailableManagedProvider(providerId: string): boolean {
  return !isInternalProviderReference(providerId) && !UNAVAILABLE_MANAGED_PATTERN.test(providerId);
}
