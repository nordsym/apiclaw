const LEGACY_STORAGE_KEY = "apiclaw_workspace_session";
const REFRESH_LEAD_MS = 2 * 60 * 1000;
const REFRESH_RETRY_MS = 15 * 1000;

type BrowserSession = {
  token: string;
  expiresAt: number;
};

type BrowserSessionListener = (token: string | null) => void;

let currentSession: BrowserSession | null = null;
let refreshTimer: number | null = null;
let refreshInFlight: Promise<BrowserSession | null> | null = null;
const listeners = new Set<BrowserSessionListener>();

export function getBrowserSessionRefreshDelay(expiresAt: number, now = Date.now()): number {
  return Math.max(1_000, expiresAt - now - REFRESH_LEAD_MS);
}

function parseBrowserSession(body: unknown, now = Date.now()): BrowserSession | null {
  const candidate = body as { browserToken?: unknown; browserExpiresAt?: unknown } | null;
  if (
    typeof candidate?.browserToken !== "string" ||
    candidate.browserToken.length < 32 ||
    typeof candidate.browserExpiresAt !== "number" ||
    !Number.isFinite(candidate.browserExpiresAt) ||
    candidate.browserExpiresAt <= now
  ) {
    return null;
  }

  return { token: candidate.browserToken, expiresAt: candidate.browserExpiresAt };
}

function notify(next: BrowserSession | null) {
  currentSession = next;
  listeners.forEach((listener) => {
    listener(next?.token ?? null);
  });
}

function scheduleRefresh(session: BrowserSession, delay?: number) {
  if (typeof window === "undefined") return;
  if (refreshTimer) window.clearTimeout(refreshTimer);

  const refreshDelay = delay ?? getBrowserSessionRefreshDelay(session.expiresAt);
  refreshTimer = window.setTimeout(() => {
    void refreshBrowserSession();
  }, refreshDelay);
}

async function requestBrowserSession(method: "GET" | "POST", legacyToken?: string) {
  const response = await fetch("/api/workspace-auth/session", {
    method,
    ...(legacyToken ? { headers: { Authorization: `Bearer ${legacyToken}` } } : {}),
    cache: "no-store",
    credentials: "same-origin",
  });
  if (!response.ok) return null;
  return parseBrowserSession(await response.json());
}

async function refreshBrowserSession(): Promise<BrowserSession | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const next = await requestBrowserSession("GET");
      if (next) {
        // Convex leaves the previous child valid through its original expiry,
        // so consumers can switch to the rotated token without a request gap.
        notify(next);
        scheduleRefresh(next);
        return next;
      }
    } catch {
      // Retry below while the current child remains usable.
    }

    const now = Date.now();
    if (currentSession && currentSession.expiresAt > now) {
      scheduleRefresh(
        currentSession,
        Math.max(1_000, Math.min(REFRESH_RETRY_MS, currentSession.expiresAt - now - 1_000)),
      );
      return currentSession;
    }

    // During first bootstrap, allow the legacy-cookie migration to run before
    // telling subscribers to redirect. A previously issued child that has
    // actually expired is terminal and must be removed from memory.
    if (currentSession) notify(null);
    return null;
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

export function subscribeWorkspaceSessionToken(listener: BrowserSessionListener): () => void {
  listeners.add(listener);
  if (currentSession && currentSession.expiresAt > Date.now()) {
    listener(currentSession.token);
  }
  return () => listeners.delete(listener);
}

export async function getWorkspaceSessionToken(): Promise<string | null> {
  if (currentSession && currentSession.expiresAt > Date.now()) {
    return currentSession.token;
  }

  let legacyToken: string | null = null;
  try {
    if (typeof window !== "undefined") {
      legacyToken = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    }

    let next = await refreshBrowserSession();
    if (!next && legacyToken) {
      next = await requestBrowserSession("POST", legacyToken);
      if (next) {
        notify(next);
        scheduleRefresh(next);
      }
    }

    return next?.token ?? null;
  } catch {
    return null;
  } finally {
    // No durable owner or browser bearer remains readable by JavaScript.
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  }
}
