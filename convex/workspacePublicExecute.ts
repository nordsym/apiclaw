import { buildPinnedPublicApiUrl, type WorkspacePublicApi } from "../src/workspace-public-apis";

import { decodePublicApiResponse } from "../src/workspace-public-response";
import { fetchWorkspacePublicGet } from "../src/workspace-public-transport";

type Result = { status: number; body: Record<string, unknown> };

/** Only pinned, unauthenticated upstream reads. No managed usage or payment dependencies. */
export async function executeWorkspacePublicApi(
  api: WorkspacePublicApi,
  action: string,
  params: Record<string, unknown>,
  dependencies: {
    fetch?: typeof fetch;
    sleep?: (milliseconds: number) => Promise<void>;
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
  if (!pinned) return error(400, "unsafe_public_origin", "Use this API's registered HTTPS address and an approved public read endpoint.");
  try {
    const response = isKrokiRender
      ? await (dependencies.fetch ?? fetch)(pinned.toString(), {
      method: isKrokiRender ? "POST" : "GET",
      headers: { Accept: "application/json", "User-Agent": "APIClaw/1.0 (+https://apiclaw.cloud)",
        ...(isKrokiRender ? { "Content-Type": "text/plain" } : {}) },
      ...(isKrokiRender ? { body: params.diagram as string } : {}),
      redirect: "error",
      signal: AbortSignal.timeout(20_000),
    }) : await fetchWorkspacePublicGet(api, pinned, dependencies);
    if (!response.ok) {
      return error(response.status === 429 ? 429 : 502, "public_api_unavailable",
        response.status === 429 ? "This free API is busy. Please try again shortly." : "This free API is temporarily unavailable. Please try another API.");
    }
    const raw = await dependencies.readText(response);
    const decoded = decodePublicApiResponse(isKrokiRender ? { responseKind: params.format === "png" || params.format === "jpeg" ? "image" : "xml" } : api, raw, response.headers.get("Content-Type") ?? "");
    if (!decoded.valid) return error(502, "public_api_unavailable", "This free API did not return a valid API response. Please choose another API.");
    const data = decoded.data;
    await dependencies.recordSuccess();
    return { status: 200, body: { success: true, provider: api.id, action, data, _apiclaw: metadata() } };
  } catch {
    return error(502, "public_api_unavailable", "We couldn't reach this free API. Please try again or choose another API.");
  }
}
