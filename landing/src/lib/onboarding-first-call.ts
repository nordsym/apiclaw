/**
 * Workspace onboarding first-call copy and gate.
 *
 * Rails match src/first-execute-rails.ts: NASA APOD, then Frankfurter latest.
 * Brave / Serper / Firecrawl are billed and must not appear on this path.
 * The agent door waits for the client's first tool call. Browser execute is
 * only a fallback for the CLI / HTTP doors.
 */

export const ONBOARDING_OVERLAY_CLASS =
  "fixed inset-0 z-[60] flex items-end justify-center bg-white/10 backdrop-blur-2xl backdrop-saturate-150 p-0 sm:items-center sm:p-4";

export const WAITING_FOR_FIRST_CALL = "Waiting for your first tool call";

export const INSTALL_COMMAND = "curl -fsSL https://apiclaw.cloud/install.sh | bash";

export const CLI_DISCOVER = 'npx @nordsym/apiclaw discover "astronomy" --callable';

export const CLI_CALL =
  "npx @nordsym/apiclaw call nasa/apod --params '{}' --idempotency-key \"apiclaw-first-nasa-$(date +%s)\"";

export const REMOTE_MCP_URL = "https://apiclaw.cloud/mcp";

export const AGENT_FIRST_CALL_PROMPT =
  'Follow https://apiclaw.cloud/SKILL.md. Install if needed: curl -fsSL https://apiclaw.cloud/install.sh | bash or npx @nordsym/apiclaw@latest. Run auth login and loop whoami until it prints an email. Then fetch today\'s NASA Astronomy Picture of the Day: call_api with provider "nasa", action "apod", params {}. If NASA is not 200, call_api with provider "frankfurter", action "latest", params { path: "/latest" }. Do not paste a token. Do not add a card. Do not lead with billed research (Brave, Serper, Firecrawl).';

/** Same order as src/first-execute-rails.ts FIRST_EXECUTE_RAILS. */
export const BROWSER_FIRST_EXECUTE_RAILS = [
  { provider: "nasa", action: "apod", params: {} as Record<string, unknown> },
  { provider: "frankfurter", action: "latest", params: { path: "/latest" } as Record<string, unknown> },
] as const;

export type OnboardingState = {
  completedAt: number | null;
  dismissedAt: number | null;
  firstCallAt: number | null;
};

/** Used when getState fails or is unknown. first_call is missing, so fail-open. */
export const UNKNOWN_ONBOARDING_STATE: OnboardingState = {
  completedAt: null,
  dismissedAt: null,
  firstCallAt: null,
};

export type OnboardingGate = "closed" | "complete" | "resume" | "open";

/**
 * first_call already landed (completeFirstExecute or the agent) must not
 * trap the user in the wizard. Dismissed without a first call can resume.
 * Unknown / failed getState fails open so a new Clerk user cannot wander.
 */
export function decideOnboardingGate(state: OnboardingState | null): OnboardingGate {
  if (!state) return "open";
  if (state.completedAt) return "closed";
  if (state.firstCallAt) return "complete";
  if (state.dismissedAt) return "resume";
  return "open";
}

export function httpFirstCallCurl(key: string): string {
  return `curl https://api.apiclaw.cloud/v1/execute -H "Authorization: Bearer ${key}" -H "Idempotency-Key: $(uuidgen)" -H "Content-Type: application/json" -d '{"provider":"nasa","action":"apod","params":{}}'`;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function payloadData(body: unknown): Record<string, unknown> | undefined {
  const root = asRecord(body);
  if (!root) return undefined;
  return asRecord(root.data) ?? root;
}

export function formatOnboardingExecuteResult(
  provider: string,
  body: unknown,
): string | undefined {
  const data = payloadData(body);
  if (!data) return undefined;
  if (provider === "nasa") {
    const title = data.title;
    if (typeof title === "string" && title.trim()) return `NASA APOD: ${title.trim()}`;
    return "NASA APOD received";
  }
  if (provider === "frankfurter") {
    const rates = asRecord(data.rates);
    const usd = rates?.USD;
    if (typeof usd === "number" && Number.isFinite(usd)) return `EUR/USD ${usd}`;
    if (typeof usd === "string" && usd.trim()) return `EUR/USD ${usd.trim()}`;
    return "EUR FX rate received";
  }
  return undefined;
}

export function isOnboardingExecuteSuccess(status: number, body: unknown): boolean {
  if (status !== 200) return false;
  const root = asRecord(body);
  if (root && root.success === false) return false;
  return true;
}
