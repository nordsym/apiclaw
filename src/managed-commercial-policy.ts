import { PAYG_RESALE_PROVIDER_IDS } from "./product-truth.js";
/** Current launch boundary, backed by docs/ops/managed-api-audit.md. */
export const PAID_MANAGED_PROVIDERS = PAYG_RESALE_PROVIDER_IDS;

export function managedPaidProviderReady(provider: string): boolean {
  return PAID_MANAGED_PROVIDERS.some((id) => id === provider.toLowerCase());
}

export const PAID_OPENROUTER_MODELS = [
  "openai/gpt-5.4-nano", "openai/gpt-5.4-mini", "openai/gpt-5.4",
] as const;

export function managedPaidCallReady(provider: string, model?: string): boolean {
  return managedPaidProviderReady(provider) && PAID_OPENROUTER_MODELS.some((id) => id === model);
}

export const MANAGED_BILLING_UNAVAILABLE_MESSAGE =
  "This managed API is not available for paid use yet. You have not been charged. Choose OpenRouter with openai/gpt-5.4-nano, or use your own provider connection.";
