import { CURSOR_DESKTOP_REDIRECT_URI } from "./oauth-dcr.generated";

export function parseSafeOAuthRedirectUri(value: string): URL | null {
  try {
    const parsed = new URL(value);
    const isLoopbackHttp = parsed.protocol === "http:" &&
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "[::1]");
    const callback = new URL(parsed);
    callback.search = "";
    const isCursorDesktop = callback.toString() === CURSOR_DESKTOP_REDIRECT_URI;
    if (parsed.protocol !== "https:" && !isLoopbackHttp && !isCursorDesktop) return null;
    if (parsed.username || parsed.password || parsed.hash) return null;
    return parsed;
  } catch {
    return null;
  }
}
