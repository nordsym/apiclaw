/**
 * Gate for RFC 7591 Dynamic Client Registration.
 *
 * Anonymous registration requires every redirect URI to be explicitly
 * allowlisted. Other loopback redirects additionally require an initial
 * access token (RFC 7591 §3) matching OAUTH_DCR_INITIAL_ACCESS_TOKEN.
 * Workspace-issued connectors do not use this gate; they are minted by an
 * authenticated dashboard session and bound to that workspace.
 */

export const MIN_INITIAL_ACCESS_TOKEN_LENGTH = 32;

// Legacy desktop callback confirmed by Cursor support:
// https://forum.cursor.com/t/linear-mcp-auth-fails-with-invalid-redirect-uri-cursor-anysphere-cursor-mcp-oauth-callback/158845/5
export const CURSOR_DESKTOP_REDIRECT_URI = "cursor://anysphere.cursor-mcp/oauth/callback";

/** Exact connector callbacks. Do not allow entire client domains or schemes. */
export const BUILTIN_DCR_REDIRECT_URIS = [
  // Current web/Agents and desktop callbacks: https://cursor.com/docs/mcp
  "https://www.cursor.com/agents/mcp/oauth/callback",
  "http://localhost:8787/callback",
  CURSOR_DESKTOP_REDIRECT_URI,
  "https://grok.com/connectors-oauth/callback",
  "https://chat.openai.com/connector_callback",
  "https://chatgpt.com/connector_platform_oauth_redirect",
] as const;

/**
 * ChatGPT registers a per-connector callback under this prefix
 * (`https://chatgpt.com/connector/oauth/{callback_id}`). The host is
 * ChatGPT's, so the code does not come back to an attacker-controlled origin.
 */
const CHATGPT_CONNECTOR_REDIRECT_PREFIX = "https://chatgpt.com/connector/oauth/";

export type RegistrationDecision =
  | {
      ok: true;
      initialAccessToken?: string;
      redirectUris: string[];
    }
  | {
      ok: false;
      status: 401 | 400;
      error: string;
      error_description: string;
    };

export function timingSafeEqualString(left: string, right: string): boolean {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  const length = Math.max(a.length, b.length, 1);
  let diff = a.length ^ b.length;
  for (let i = 0; i < length; i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}

export function initialAccessTokenMatches(
  presented: string | undefined,
  configured: string | undefined,
): boolean {
  if (typeof configured !== "string" || configured.length < MIN_INITIAL_ACCESS_TOKEN_LENGTH) {
    return false;
  }
  const candidate = typeof presented === "string" ? presented : "";
  return timingSafeEqualString(candidate, configured);
}

export function parseBearerToken(authorizationHeader: string | null | undefined): string | null {
  if (!authorizationHeader) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(authorizationHeader.trim());
  return match?.[1] ?? null;
}

function isLoopbackHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

/** HTTPS, loopback HTTP, or the exact legacy Cursor callback. No credentials or fragment. */
export function normalizeSafeRedirectUri(uri: string): string | null {
  if (typeof uri !== "string" || uri.length === 0 || uri.length > 2000) return null;
  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch {
    return null;
  }
  const isLoopbackHttp = parsed.protocol === "http:" && isLoopbackHostname(parsed.hostname);
  if (parsed.protocol !== "https:" && !isLoopbackHttp && uri !== CURSOR_DESKTOP_REDIRECT_URI) return null;
  if (parsed.username || parsed.password || parsed.hash) return null;
  return parsed.toString();
}

function parseExtraAllowlist(raw: string | undefined): Set<string> {
  const allowed = new Set<string>();
  if (!raw) return allowed;
  for (const entry of raw.split(",")) {
    const normalized = normalizeSafeRedirectUri(entry.trim());
    if (normalized) allowed.add(normalized);
  }
  return allowed;
}

function isChatGptConnectorRedirect(normalized: string): boolean {
  if (!normalized.startsWith(CHATGPT_CONNECTOR_REDIRECT_PREFIX)) return false;
  const rest = normalized.slice(CHATGPT_CONNECTOR_REDIRECT_PREFIX.length);
  return /^[A-Za-z0-9_-]+$/.test(rest);
}

/** Anonymous DCR never inherits the general loopback exception. */
export function isAllowlistedPublicDynamicRedirect(
  uri: string,
  extraAllowlistRaw: string | undefined,
): boolean {
  const normalized = normalizeSafeRedirectUri(uri);
  if (!normalized || normalized !== uri) return false;
  return (BUILTIN_DCR_REDIRECT_URIS as readonly string[]).includes(uri)
    || isChatGptConnectorRedirect(uri)
    || parseExtraAllowlist(extraAllowlistRaw).has(uri);
}

export function isAllowlistedDynamicRedirect(
  uri: string,
  extraAllowlistRaw: string | undefined,
): boolean {
  const normalized = normalizeSafeRedirectUri(uri);
  if (!normalized) return false;
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return false;
  }
  if (parsed.protocol === "http:" && isLoopbackHostname(parsed.hostname)) return true;
  if ((BUILTIN_DCR_REDIRECT_URIS as readonly string[]).includes(normalized)) return true;
  if (isChatGptConnectorRedirect(normalized)) return true;
  return parseExtraAllowlist(extraAllowlistRaw).has(normalized);
}

const CLOSED: RegistrationDecision = {
  ok: false,
  status: 401,
  error: "invalid_token",
  error_description: "Dynamic client registration requires allowlisted redirects or an initial access token for loopback redirects.",
};

/**
 * Decide whether a dynamic registration request may mint credentials.
 * Anonymous callers may register only explicitly allowlisted callbacks.
 * A valid initial access token also permits other safe loopback callbacks.
 */
export function registrationDecision(input: {
  authorizationHeader: string | null;
  configuredToken: string | undefined;
  redirectUris: string[];
  extraAllowlistRaw?: string | undefined;
}): RegistrationDecision {
  const presented = parseBearerToken(input.authorizationHeader) ?? undefined;
  const authenticated = initialAccessTokenMatches(presented, input.configuredToken);
  if (input.authorizationHeader !== null && !authenticated) return CLOSED;
  if (!Array.isArray(input.redirectUris) || input.redirectUris.length === 0) {
    if (!authenticated) return CLOSED;
    return {
      ok: false,
      status: 400,
      error: "invalid_redirect_uri",
      error_description: "redirect_uris is required",
    };
  }
  const normalized: string[] = [];
  for (const uri of input.redirectUris) {
    if (!authenticated && !isAllowlistedPublicDynamicRedirect(uri, input.extraAllowlistRaw)) return CLOSED;
    if (!isAllowlistedDynamicRedirect(uri, input.extraAllowlistRaw)) {
      return {
        ok: false,
        status: 400,
        error: "invalid_redirect_uri",
        error_description: "redirect_uri is not allowed for dynamic registration",
      };
    }
    const safe = normalizeSafeRedirectUri(uri);
    if (!safe) {
      return {
        ok: false,
        status: 400,
        error: "invalid_redirect_uri",
        error_description: "redirect_uri is not allowed for dynamic registration",
      };
    }
    normalized.push(safe);
  }
  return {
    ok: true,
    ...(authenticated ? { initialAccessToken: presented } : {}),
    redirectUris: normalized,
  };
}

/**
 * Shared Convex-side gate. Throws before any client row is written when the
 * caller fails the same allowlist/initial-access-token policy as the route.
 */
export function assertCanRegisterDynamicClient(input: {
  presentedToken: string | undefined;
  configuredToken: string | undefined;
  redirectUris: string[];
  extraAllowlistRaw?: string | undefined;
}): { redirectUris: string[] } {
  const decision = registrationDecision({
    authorizationHeader: input.presentedToken !== undefined ? `Bearer ${input.presentedToken}` : null,
    configuredToken: input.configuredToken,
    redirectUris: input.redirectUris,
    extraAllowlistRaw: input.extraAllowlistRaw,
  });
  if (!decision.ok) {
    throw new Error(
      decision.status === 401
        ? "dynamic_client_registration_closed"
        : decision.error,
    );
  }
  return { redirectUris: decision.redirectUris };
}
