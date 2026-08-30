/**
 * Shared CLI Authorize claim. Used by the /auth/cli POST action and by
 * clerk-bridge after a fresh Clerk sign-in that started on /auth/cli.
 *
 * A signed-in GET of /auth/cli must never call this — that would bind a
 * hostile authId without a user gesture. clerk-bridge may call it only
 * when the unsigned /auth/cli visit set the clerk-intent cookie (the
 * human then completed Clerk on that continuation).
 */

import { AUTHID_FORMAT } from "./shared";

const CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL ||
  "https://adventurous-avocet-799.convex.cloud";

export const CLI_CLERK_INTENT_COOKIE = "apiclaw_cli_clerk_intent";

export type ClaimResult = {
  success: boolean;
  error?: string;
  code?: string;
  port?: number;
  state?: string;
};

export function cliAuthIdFromPath(path: string | undefined | null): string | undefined {
  if (!path) return undefined;
  try {
    const parsed = new URL(path, "https://apiclaw.cloud");
    if (parsed.pathname !== "/auth/cli") return undefined;
    const authId = parsed.searchParams.get("authId") ?? "";
    return AUTHID_FORMAT.test(authId) ? authId : undefined;
  } catch {
    return undefined;
  }
}

/**
 * True only when the unsigned /auth/cli page set the intent cookie for
 * this exact authId. Missing/mismatched intent means an existing Clerk
 * session or a /sign-in?redirect= deep link — those still need the
 * Authorize button (login CSRF).
 */
export function shouldCollapseClerkConsent(
  authId: string | undefined,
  intentCookie: string | undefined,
): boolean {
  return Boolean(
    authId &&
      intentCookie &&
      intentCookie === authId &&
      AUTHID_FORMAT.test(authId),
  );
}

export function cliAuthDonePath(args: {
  authId: string;
  port: number;
  code: string;
  state: string;
}): string {
  const done = new URLSearchParams({
    authId: args.authId,
    port: String(args.port),
    code: args.code,
    state: args.state,
  });
  return `/auth/cli/done?${done.toString()}`;
}

export function cliAuthClaimErrorPath(authId: string, error: string | undefined): string {
  return `/auth/cli?authId=${encodeURIComponent(authId)}&error=${encodeURIComponent(error ?? "unknown")}`;
}

export async function claimCliAuthId(
  authId: string,
  clerkUserId: string,
  email: string,
): Promise<ClaimResult> {
  try {
    const internalSecret = process.env.APICLAW_INTERNAL_SECRET;
    if (!internalSecret) return { success: false, error: "server_not_configured" };
    const res = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "cliAuth:claim",
        args: { authId, clerkUserId, email, internalSecret },
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      return { success: false, error: `convex_http_${res.status}` };
    }
    const data = await res.json();
    return (data?.value ?? data) as ClaimResult;
  } catch {
    return { success: false, error: "convex_unreachable" };
  }
}
