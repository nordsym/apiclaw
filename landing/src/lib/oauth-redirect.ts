export function parseSafeOAuthRedirectUri(value: string): URL | null {
  try {
    const parsed = new URL(value);
    const isLoopbackHttp = parsed.protocol === "http:" &&
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "[::1]");
    if (parsed.protocol !== "https:" && !isLoopbackHttp) return null;
    if (parsed.username || parsed.password || parsed.hash) return null;
    return parsed;
  } catch {
    return null;
  }
}
