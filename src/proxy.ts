/**
 * APIClaw Proxy - Fallback to hosted API when no local credentials
 */

import { readSession, getMachineFingerprint } from './session.js';

const PROXY_BASE = "https://adventurous-avocet-799.convex.site/proxy";

export async function callProxy(provider: string, params: any): Promise<any> {
  const url = `${PROXY_BASE}/${provider}`;
  
  // Get session and fingerprint for tracking
  const session = readSession();
  const fingerprint = getMachineFingerprint();
  const identifier = session?.workspaceId || `anon:${fingerprint}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "X-APIClaw-Identifier": identifier,
      "X-APIClaw-Provider": provider,
      "X-APIClaw-Action": params.action || "call",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Proxy request failed" })) as { error?: string };
    throw new Error(errorData.error || `Proxy error: ${response.status}`);
  }

  return response.json();
}

export const PROXY_PROVIDERS = ["openrouter", "brave_search", "resend", "elevenlabs", "46elks", "twilio", "replicate", "firecrawl", "e2b", "groq", "deepgram", "serper", "mistral", "cohere", "together", "stability", "assemblyai", "github"];
