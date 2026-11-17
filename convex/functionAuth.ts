import type { MutationCtx } from "./_generated/server";
import { findUsableAgentSession } from "./sessionSecurity";

/** Server-only callers must authenticate before any privileged read or write. */
export function requireInternalSecret(presented: string): void {
  const expected = process.env.APICLAW_INTERNAL_SECRET;
  if (!expected || presented !== expected) throw new Error("Unauthorized");
}


/** Accept a server credential or a session bound to the claimed workspace. */
export async function requireWorkspaceCaller(
  ctx: MutationCtx,
  credentials: { token?: string; internalSecret?: string },
  workspaceId?: string,
): Promise<void> {
  if (credentials.internalSecret !== undefined) {
    requireInternalSecret(credentials.internalSecret);
    return;
  }
  const session = credentials.token
    ? await findUsableAgentSession(ctx.db, credentials.token)
    : null;
  if (!session || (workspaceId && session.workspaceId !== workspaceId)) {
    throw new Error("Unauthorized");
  }
}
