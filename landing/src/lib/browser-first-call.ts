import { recoverWorkspaceSessionToken } from "./workspace-session";

/** Uses the same customer gateway and session as CLI calls. Never sends a key. */
export async function runBrowserNasaCall(token: string, request: typeof fetch = fetch) {
  const gateway = process.env.NEXT_PUBLIC_APICLAW_GATEWAY_URL ||
    (process.env.NEXT_PUBLIC_CONVEX_URL?.replace(".convex.cloud", ".convex.site") || "https://api.apiclaw.cloud");
  const idempotencyKey = `web-nasa-${crypto.randomUUID()}`;
  const execute = (session: string) => request(`${gateway}/v1/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-APIClaw-Session": session, "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ provider: "nasa", action: "apod", params: {} }),
    // The managed gateway allows 60 seconds upstream, plus response overhead.
    signal: AbortSignal.timeout(70_000),
  });
  let response = await execute(token);
  if (response.status === 401) {
    const renewed = await recoverWorkspaceSessionToken(token);
    if (!renewed) throw new Error("Your session expired. Log in again to try the free call.");
    response = await execute(renewed);
  }
  const body = await response.json().catch(() => null);
  const data = body?.data ?? body;
  if (!response.ok || body?.success === false || typeof data?.title !== "string") {
    throw new Error(response.status === 429
      ? "NASA is busy right now. Please try again shortly. This call is free."
      : "NASA could not return a picture right now. Please try again. This call is free.");
  }
  return data as { title: string; explanation?: string; date?: string; url?: string; media_type?: string };
}
