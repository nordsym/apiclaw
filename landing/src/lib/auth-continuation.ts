const AUTH_CONTINUATION_PREFIXES = [
  "/auth/cli",
  "/dashboard",
  "/oauth/authorize",
  "/sign-in",
  "/workspace",
];

const CLERK_BRIDGE_PATH = "/api/workspace-auth/clerk-bridge";

/**
 * Allowlisted post-auth path from a query value, or undefined when the
 * value is missing or rejected. Rejected values must not become /workspace
 * here — that would look like an explicit continuation and skip the
 * ClerkProvider clerk-bridge default.
 */
export function explicitAuthContinuation(
  value: string | null | undefined,
): string | undefined {
  if (!value) return undefined;
  const resolved = safeAuthContinuation(value, "/workspace");
  if (resolved === "/workspace") {
    try {
      const parsed = new URL(value, "https://apiclaw.cloud");
      if (parsed.pathname === "/workspace" || parsed.pathname.startsWith("/workspace/")) {
        return resolved;
      }
    } catch {
      return undefined;
    }
    return undefined;
  }
  return resolved;
}

/**
 * Post-Clerk destination for <SignIn/> / <SignUp/>.
 * Always land on clerk-bridge (so the workspace cookie is minted), with
 * `next` set when the URL carried an allowlisted continuation. Compute
 * this before Clerk mounts — a missing first-paint value used to fall
 * through to clerk-bridge with no next, which sent CLI logins to
 * /workspace and never returned to /auth/cli?authId=…
 */
export function clerkForcedRedirectUrl(
  value: string | null | undefined,
): string {
  const continuation = explicitAuthContinuation(value);
  if (!continuation) return CLERK_BRIDGE_PATH;
  return `${CLERK_BRIDGE_PATH}?next=${encodeURIComponent(continuation)}`;
}

/**
 * Bounce between /sign-in and /sign-up with the original continuation
 * (CLI authId, OAuth request), not the clerk-bridge wrapper.
 */
export function clerkCompanionAuthUrl(
  path: "/sign-in" | "/sign-up",
  requestedRedirect: string | null | undefined,
): string {
  const continuation = explicitAuthContinuation(requestedRedirect);
  if (!continuation) return path;
  return `${path}?redirect_url=${encodeURIComponent(continuation)}`;
}

export function safeAuthContinuation(
  value: string | null | undefined,
  fallback: "/workspace" | "/sign-in" = "/workspace",
): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  // Encoded separators are dangerous in the route path, but valid OAuth
  // query values routinely contain encoded absolute redirect URIs.
  const encodedPath = value.split(/[?#]/, 1)[0].toLowerCase();
  if (encodedPath.includes("%2f") || encodedPath.includes("%5c") || encodedPath.includes("%00")) {
    return fallback;
  }
  try {
    const parsed = new URL(value, "https://apiclaw.cloud");
    if (parsed.origin !== "https://apiclaw.cloud") return fallback;
    const allowed = AUTH_CONTINUATION_PREFIXES.some((prefix) =>
      parsed.pathname === prefix || parsed.pathname.startsWith(`${prefix}/`)
    );
    return allowed ? `${parsed.pathname}${parsed.search}${parsed.hash}` : fallback;
  } catch {
    return fallback;
  }
}
