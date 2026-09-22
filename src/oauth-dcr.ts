/**
 * Gate for RFC 7591 Dynamic Client Registration.
 *
 * Public registration is closed. A caller must present an initial access
 * token (RFC 7591 §3) that matches OAUTH_DCR_INITIAL_ACCESS_TOKEN, and every
 * redirect URI must be loopback or on the hosted-client allowlist.
 * Workspace-issued connectors do not use this gate; they are minted by an
 * authenticated dashboard session and bound to that workspace.
 */

export const MIN_INITIAL_ACCESS_TOKEN_LENGTH = 32;

/** Exact redirect URIs already used by first-party connector presets. */
export const BUILTIN_DCR_REDIRECT_URIS = [
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
      initialAccessToken: string;
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

/** HTTPS, or HTTP only on a loopback host. No credentials, no fragment. */
export function normalizeSafeRedirectUri(uri: string): string | null {
  if (typeof uri !== "string" || uri.length === 0 || uri.length > 2000) return null;
  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch {
    return null;
  }
  const isLoopbackHttp = parsed.protocol === "http:" && isLoopbackHostname(parsed.hostname);
  if (parsed.protocol !== "https:" && !isLoopbackHttp) return null;
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
  error_description: "Dynamic client registration requires an initial access token.",
};

/**
 * Decide whether a dynamic registration request may mint credentials.
 * Unauthenticated callers are rejected before redirect policy is applied,
 * so a missing token never becomes a client_id.
 */
export function registrationDecision(input: {
  authorizationHeader: string | null;
  configuredToken: string | undefined;
  redirectUris: string[];
  extraAllowlistRaw?: string | undefined;
}): RegistrationDecision {
  const presented = parseBearerToken(input.authorizationHeader) ?? undefined;
  if (!initialAccessTokenMatches(presented, input.configuredToken)) {
    return CLOSED;
  }
  if (!Array.isArray(input.redirectUris) || input.redirectUris.length === 0) {
    return {
      ok: false,
      status: 400,
      error: "invalid_redirect_uri",
      error_description: "redirect_uris is required",
    };
  }
  const normalized: string[] = [];
  for (const uri of input.redirectUris) {
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
    initialAccessToken: presented as string,
    redirectUris: normalized,
  };
}

/**
 * Shared Convex-side gate. Throws before any client row is written when the
 * caller is unauthenticated or the redirect URI is not allowlisted.
 */
export function assertCanRegisterDynamicClient(input: {
  presentedToken: string | undefined;
  configuredToken: string | undefined;
  redirectUris: string[];
  extraAllowlistRaw?: string | undefined;
}): { redirectUris: string[] } {
  const decision = registrationDecision({
    authorizationHeader: input.presentedToken ? `Bearer ${input.presentedToken}` : null,
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
