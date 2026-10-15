import type { WorkspacePublicApi } from "./workspace-public-apis.js";

/** Formats are reviewed metadata; an HTML login/error page never counts as an API response. */
export function decodePublicApiResponse(
  api: Pick<WorkspacePublicApi, "responseKind">,
  raw: string,
  contentType = "",
): { valid: boolean; data?: unknown } {
  const text = raw.trim();
  if (!text || /<!doctype\s+html|<html(?:\s|>)/i.test(text.slice(0, 512))) {
    return { valid: false };
  }
  const kind = api.responseKind ?? "json";
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { /* Non-JSON is accepted only for a reviewed format. */ }
  if (parsed !== null && typeof parsed === "object" && parsed !== undefined) {
    const body = parsed as Record<string, unknown>;
    const meaningfulError = (value: unknown): boolean => {
      if (value === undefined || value === null || value === false || value === 0) return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "object") return Object.keys(value).length > 0;
      if (typeof value === "string") return value.trim().length > 0;
      return true;
    };
    if (["error", "errors", "Error", "Errors", "fault", "Fault"].some((key) => meaningfulError(body[key]))
      || body.success === false || (typeof body.status === "string" && body.status.toLowerCase() === "error")) {
      return { valid: false };
    }
    const message = typeof body.message === "string" ? body.message : "";
    const errorMessage = /error|invalid|missing|not found|unauthori[sz]ed|forbidden|denied|fail|bad request|rate limit|too many/i.test(message);
    if (errorMessage && [body.status, body.code].some((value) => typeof value === "number" && value >= 400)) {
      return { valid: false };
    }
    // Open Trivia's documented 1..5 error codes accompany an empty results list.
    if (typeof body.response_code === "number" && body.response_code >= 1 && body.response_code <= 5
      && Array.isArray(body.results) && body.results.length === 0) return { valid: false };
  }
  if (kind === "json") {
    const populated = parsed !== undefined && parsed !== null && parsed !== ""
      && (typeof parsed !== "object" || Object.keys(parsed).length > 0);
    return { valid: populated, data: parsed };
  }
  if (kind === "xml") {
    const root = text.match(/^(?:<\?xml[^>]*>\s*)?<([A-Za-z_][\w:.-]*)(?:\s[^>]*)?(?:>|\/>)/);
    const rootName = root?.[1];
    return { valid: !!rootName && !/^(error|errors|fault)$/i.test(rootName)
      && (text.endsWith(`</${rootName}>`) || root![0].endsWith("/>")), data: { raw } };
  }
  if (kind === "csv") {
    const lines = text.split(/\r?\n/).filter(Boolean);
    return { valid: lines.length >= 2 && /[,;\t]/.test(lines[0]) && /[,;\t]/.test(lines[1]), data: { raw } };
  }
  if (kind === "text") {
    return { valid: !text.startsWith("<"), data: { raw } };
  }
  // Binary image transport has no reviewed size-bounded response contract yet.
  return { valid: false };
}
