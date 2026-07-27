import type { Doc } from "./_generated/dataModel";
import type { DatabaseReader } from "./_generated/server";

export const BROWSER_SESSION_TTL_MS = 15 * 60 * 1000;

export type SessionSecurityFields = {
  sessionToken: string;
  sessionKind?: "owner" | "browser";
  parentSessionId?: unknown;
  expiresAt?: number;
};

export type SessionAudience = "workspace" | "durable";

export function isBrowserSession(session: SessionSecurityFields): boolean {
  // A parent link is browser-only. Treat malformed/transitional rows with a
  // parent as browser sessions even if sessionKind is missing.
  return session.sessionKind === "browser" || session.parentSessionId !== undefined;
}

export function isSessionExpired(
  session: Pick<SessionSecurityFields, "expiresAt">,
  now = Date.now(),
): boolean {
  return session.expiresAt !== undefined && session.expiresAt <= now;
}

export function isSessionUsable<T extends SessionSecurityFields>(
  session: T | null,
  now = Date.now(),
): session is T {
  if (!session) return false;
  if (
    isBrowserSession(session) &&
    (
      session.sessionKind !== "browser" ||
      session.parentSessionId === undefined ||
      session.expiresAt === undefined
    )
  ) {
    return false;
  }
  return !isSessionExpired(session, now);
}

export function canMintBrowserSession(
  session: SessionSecurityFields | null,
  now = Date.now(),
): boolean {
  return Boolean(session && !isBrowserSession(session) && !isSessionExpired(session, now));
}

export function shouldDeleteBrowserSession(
  session: SessionSecurityFields | null,
  expectedToken: string,
  now = Date.now(),
): boolean {
  return Boolean(
    session &&
    isBrowserSession(session) &&
    session.sessionToken === expectedToken &&
    session.expiresAt !== undefined &&
    session.expiresAt <= now,
  );
}

export async function findAgentSessionByToken(
  db: DatabaseReader,
  token: string,
): Promise<Doc<"agentSessions"> | null> {
  return db
    .query("agentSessions")
    .withIndex("by_sessionToken", (q) => q.eq("sessionToken", token))
    .first();
}

export async function findUsableAgentSession(
  db: DatabaseReader,
  token: string,
  options: { audience?: SessionAudience; now?: number } = {},
): Promise<Doc<"agentSessions"> | null> {
  const session = await findAgentSessionByToken(db, token);
  if (!isSessionUsable(session, options.now)) return null;
  if (options.audience === "durable" && isBrowserSession(session)) return null;
  return session;
}
