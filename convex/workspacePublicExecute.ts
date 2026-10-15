import { buildPinnedPublicApiUrl, type WorkspacePublicApi } from "../src/workspace-public-apis";

type Result = { status: number; body: Record<string, unknown> };

/** Only pinned, unauthenticated upstream reads. No managed usage or payment dependencies. */
export async function executeWorkspacePublicApi(
  api: WorkspacePublicApi,
  action: string,
  params: Record<string, unknown>,
  dependencies: {
    fetch?: typeof fetch;
    readText: (response: Response) => Promise<string>;
    recordSuccess: () => Promise<void>;
  },
): Promise<Result> {
  const started = Date.now();
  const metadata = () => ({ latencyMs: Date.now() - started, route: `workspace_public_${api.id}`, gateway: true });
  const error = (status: number, code: string, message: string): Result => ({
    status, body: { success: false, provider: api.id, action, error: { code, message }, _apiclaw: metadata() },
  });
  if (params.method !== undefined && String(params.method).toUpperCase() !== "GET") {
    return error(405, "method_not_allowed", "Free public API calls are read-only. Use GET.");
  }
  const isKrokiRender = api.id === "kroki" && action === "render";
  if (isKrokiRender && (typeof params.diagram !== "string" || !params.diagram)) {
    return error(400, "invalid_params", "Kroki render requires diagram text.");
  }
  const pinned = buildPinnedPublicApiUrl(api, isKrokiRender
    ? `/${params.type || "mermaid"}/${params.format || "svg"}`
    : params.path ?? api.smokePath ?? "/");
  if (!pinned) return error(400, "unsafe_public_origin", "Use a path on this API's registered HTTPS address.");
  try {
    const response = await (dependencies.fetch ?? fetch)(pinned.toString(), {
      method: isKrokiRender ? "POST" : "GET",
      headers: { Accept: "application/json", "User-Agent": "APIClaw/1.0 (+https://apiclaw.cloud)",
        ...(isKrokiRender ? { "Content-Type": "text/plain" } : {}) },
      ...(isKrokiRender ? { body: params.diagram as string } : {}),
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      return error(response.status === 429 ? 429 : 502, "public_api_unavailable",
        response.status === 429 ? "This free API is busy. Please try again shortly." : "This free API is temporarily unavailable. Please try another API.");
    }
    const raw = await dependencies.readText(response);
    let data: unknown;
    try { data = JSON.parse(raw); } catch { data = { raw }; }
    await dependencies.recordSuccess();
    return { status: 200, body: { success: true, provider: api.id, action, data, _apiclaw: metadata() } };
  } catch {
    return error(502, "public_api_unavailable", "We couldn't reach this free API. Please try again or choose another API.");
  }
}
