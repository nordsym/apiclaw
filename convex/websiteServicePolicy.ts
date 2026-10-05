// One explicitly approved service slot. Names, tiers and caller headers never grant this scope.
export const WEBSITE_WORKSPACE_ID = "n178829315bfdwpryfs20nmjf9821774";
export const WEBSITE_MODEL = "openai/gpt-5.6-sol";
export const WEBSITE_SERVICE_SCOPE = { purpose: "nordsym-website", model: WEBSITE_MODEL, managedOpenAI: true } as const;
export type WebsiteServiceScope = typeof WEBSITE_SERVICE_SCOPE;

export function isWebsiteServiceScope(workspaceId: string, scope: unknown): scope is WebsiteServiceScope {
  const value = scope as Partial<WebsiteServiceScope> | null;
  return workspaceId === WEBSITE_WORKSPACE_ID && value?.purpose === "nordsym-website" && value.model === WEBSITE_MODEL && value.managedOpenAI === true;
}

export function websiteServiceEndpointAllowed(workspaceId: string, scope: unknown, request: Request): boolean {
  return isWebsiteServiceScope(workspaceId, scope) && request.method === "POST" && new URL(request.url).pathname === "/v1/chat/completions" &&
    !request.headers.has("X-APIClaw-OAuth") && !request.headers.has("X-APIClaw-Route");
}

export function websiteServiceBodyAllowed(body: any): boolean {
  if (!body || typeof body !== "object" || Array.isArray(body) || body.model !== WEBSITE_MODEL || body.stream !== false) return false;
  if (Object.keys(body).some(key => !["model", "messages", "stream", "max_tokens", "max_completion_tokens", "reasoning_effort"].includes(key))) return false;
  const max = body.max_completion_tokens ?? body.max_tokens;
  return Number.isInteger(max) && max > 0 && max <= 1500 && !(body.max_tokens !== undefined && body.max_completion_tokens !== undefined);
}

export function websiteServiceRouteAllowed(route: { provider: string; model: string; baseUrl: string }): boolean {
  return route.provider === "openai" && route.model === "gpt-5.6-sol" && route.baseUrl === "https://api.openai.com/v1/chat/completions";
}
