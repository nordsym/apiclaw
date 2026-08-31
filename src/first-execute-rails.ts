/**
 * First managed execute after Clerk Authorize / session mint.
 *
 * Activation is a successful POST /v1/execute, not an install and not whoami.
 * Both CLI `completeFirstExecute` and Convex `activation.completeFirstExecute`
 * walk this list in order and stop on the first HTTP 200.
 *
 * Default winner: NASA APOD (`nasa` / `apod`).
 * Why: research-shaped (today's astronomy picture), customer-executable,
 * verified zero-cost so a new workspace with no card can land first_call.
 * Brave / Serper / Firecrawl are also research-shaped but billed
 * ($0.005 / $0.001 / $0.02) and `evaluateManagedUsage` returns
 * `payment_required` without a card — they cannot activate a free user.
 * Sep 20 target is activated workspaces, not PAYG.
 *
 * Fallback: Frankfurter latest (`frankfurter` / `latest`, path `/latest`).
 * Why: workspace-public, no key, proven zero-cost. The live catalog base is
 * `https://api.frankfurter.dev/v1`; joining `/latest` pins to
 * `/v1/latest` (200, no redirect). `api.frankfurter.app` 301s and the
 * gateway uses redirect:error, so that old host must not be used here.
 * FX is less "research" than search, but first_call still lands if NASA
 * is down or the managed NASA key is missing.
 *
 * Catalog display names without a slash (CoinGecko) must never be used —
 * the CLI maps those to legacy POST /v1/call.
 */

export const FIRST_EXECUTE_PATH = "/v1/execute";

export const FIRST_EXECUTE_NASA = {
  provider: "nasa",
  action: "apod",
  params: {} as Record<string, unknown>,
} as const;

export const FIRST_EXECUTE_FRANKFURTER = {
  provider: "frankfurter",
  action: "latest",
  params: { path: "/latest" } as Record<string, unknown>,
} as const;

export const FIRST_EXECUTE_RAILS = [FIRST_EXECUTE_NASA, FIRST_EXECUTE_FRANKFURTER] as const;

/** Research-shaped managed providers that require a card. Not first-execute rails. */
export const FIRST_EXECUTE_BILLED_RESEARCH_PROVIDERS = [
  "brave_search",
  "serper",
  "firecrawl",
] as const;

export type FirstExecuteAttempt = {
  provider: string;
  action: string;
  params: Record<string, unknown>;
};

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function payloadData(body: unknown): Record<string, unknown> | undefined {
  const root = asRecord(body);
  if (!root) return undefined;
  return asRecord(root.data) ?? root;
}

export function formatApodTitle(body: unknown): string | undefined {
  const data = payloadData(body);
  const title = data?.title;
  if (typeof title === "string" && title.trim()) return title.trim();
  return undefined;
}

export function formatFrankfurterRate(body: unknown): string | undefined {
  const data = payloadData(body);
  const rates = asRecord(data?.rates);
  const usd = rates?.USD;
  if (typeof usd === "number" && Number.isFinite(usd)) {
    return `EUR/USD ${usd}`;
  }
  if (typeof usd === "string" && usd.trim()) {
    return `EUR/USD ${usd.trim()}`;
  }
  return undefined;
}

export function formatFirstCallResult(provider: string, body: unknown): string | undefined {
  if (provider === "nasa") {
    const title = formatApodTitle(body);
    return title ? `NASA APOD: ${title}` : undefined;
  }
  if (provider === "frankfurter") {
    return formatFrankfurterRate(body);
  }
  return undefined;
}

export function firstExecuteFallbackSummary(provider: string): string {
  return provider === "nasa" ? "NASA APOD received" : "EUR FX rate received";
}

export function isFirstExecuteSuccess(status: number, body: unknown): boolean {
  if (status !== 200) return false;
  if (body && typeof body === "object" && !Array.isArray(body) && (body as { success?: unknown }).success === false) {
    return false;
  }
  return true;
}
