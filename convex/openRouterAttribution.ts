function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function openRouterWorkspacePseudonym(workspaceId: string, secret: string): Promise<string> {
  if (!secret) throw new Error("OpenRouter pseudonym secret is not configured");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`apiclaw:openrouter:user:v1:${workspaceId}`),
  );
  return `apiclaw_ws_${bytesToHex(new Uint8Array(digest)).slice(0, 32)}`;
}

export async function decorateOpenRouterRequest<T extends Record<string, unknown>>(
  body: T,
  workspaceId: string,
  secret: string,
): Promise<T & { user: string }> {
  return {
    ...body,
    user: await openRouterWorkspacePseudonym(workspaceId, secret),
  };
}
