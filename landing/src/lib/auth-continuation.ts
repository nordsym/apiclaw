const AUTH_CONTINUATION_PREFIXES = [
  "/auth/cli",
  "/dashboard",
  "/oauth/authorize",
  "/sign-in",
  "/workspace",
];

/**
 * Post-Clerk destination for <SignIn/> / <SignUp/>.
 * Must be computed before Clerk mounts. A missing or delayed value falls
 * through to ClerkProvider's /api/workspace-auth/clerk-bridge default,
 * which lands on /workspace and never returns to /auth/cli?authId=…
 */
export function clerkForcedRedirectUrl(
  value: string | null | undefined,
): string {
  return safeAuthContinuation(value, "/workspace");
}

export function clerkCompanionAuthUrl(
  path: "/sign-in" | "/sign-up",
  redirectUrl: string,
): string {
  return `${path}?redirect_url=${encodeURIComponent(redirectUrl)}`;
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
