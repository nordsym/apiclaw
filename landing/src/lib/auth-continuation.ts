const AUTH_CONTINUATION_PREFIXES = [
  "/auth/cli",
  "/dashboard",
  "/oauth/authorize",
  "/sign-in",
  "/workspace",
];

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
