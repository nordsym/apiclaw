/**
 * APIClaw Proxy - Fallback to hosted API when no local credentials
 */

import { readSession, getMachineFingerprint } from './session.js';

const PROXY_BASE = "https://brilliant-puffin-712.eu-west-1.convex.site/proxy";

export async function callProxy(provider: string, params: any): Promise<any> {
  const url = `${PROXY_BASE}/${provider}`;

  // Get session and fingerprint for tracking
  const session = readSession();
  const fingerprint = getMachineFingerprint();
  const identifier = session?.workspaceId || `anon:${fingerprint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-APIClaw-Identifier": identifier,
    "X-APIClaw-Provider": provider,
    "X-APIClaw-Action": params.action || "call",
  };
  // Attach session token when available so the server can resolve the workspace
  // via the signed session-token path instead of the trust-the-identifier path.
  if (session?.sessionToken) {
    headers["X-APIClaw-Session"] = session.sessionToken;
  }
  // Permanent API key env (server-to-server, e.g. OpenClaw runtime)
  if (process.env.APICLAW_API_KEY) {
    headers["X-APIClaw-Api-Key"] = process.env.APICLAW_API_KEY;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(params),
  });

  if (response.status === 401) {
    const errorData = await response.json().catch(() => ({})) as { error?: { message?: string; signupUrl?: string } };
    const signupUrl = errorData.error?.signupUrl || "https://apiclaw.com/signup";
    throw new Error(
      `APIClaw: authentication required. Run \`npx @nordsym/apiclaw login\` or sign up at ${signupUrl}.`
    );
  }
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Proxy request failed" })) as { error?: string };
    throw new Error(errorData.error || `Proxy error: ${response.status}`);
  }

  return response.json();
}

export const PROXY_PROVIDERS = ["openrouter", "brave_search", "resend", "elevenlabs", "46elks", "twilio", "replicate", "firecrawl", "e2b", "groq", "deepgram", "serper", "mistral", "cohere", "together", "stability", "assemblyai", "github", "apilayer"];
