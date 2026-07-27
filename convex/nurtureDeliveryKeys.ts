export function welcomeDeliveryIdempotencyKey(workspaceId: string): string {
  return `apiclaw-welcome-${workspaceId}`;
}

export function nurtureDeliveryIdempotencyKey(workspaceId: string, kind: string): string {
  return kind === "welcome"
    ? welcomeDeliveryIdempotencyKey(workspaceId)
    : `apiclaw-nurture-${workspaceId}-${kind}`;
}

const UNSUBSCRIBE_PURPOSE = "apiclaw:nurture-unsubscribe:v1";
const UNSUBSCRIBE_BASE_URL = "https://api.apiclaw.cloud/nurture/unsubscribe";

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
    const binary = atob(padded);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

function bytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function unsubscribeHmacKey(secret: string): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** Create a permanent, single-purpose token that can only opt out one workspace. */
export async function createNurtureUnsubscribeToken(
  workspaceId: string,
  secret: string,
): Promise<string> {
  if (!secret) throw new Error("unsubscribe_secret_missing");
  const payload = bytesToBase64Url(new TextEncoder().encode(workspaceId));
  const signature = new Uint8Array(await crypto.subtle.sign(
    "HMAC",
    await unsubscribeHmacKey(secret),
    new TextEncoder().encode(`${UNSUBSCRIBE_PURPOSE}:${payload}`),
  ));
  return `${payload}.${bytesToBase64Url(signature)}`;
}

export async function verifyNurtureUnsubscribeToken(
  token: string,
  secret: string,
): Promise<string | null> {
  if (!secret) return null;
  const [payload, signaturePart, extra] = token.split(".");
  if (!payload || !signaturePart || extra !== undefined) return null;
  const payloadBytes = base64UrlToBytes(payload);
  const signature = base64UrlToBytes(signaturePart);
  if (!payloadBytes || !signature) return null;
  const valid = await crypto.subtle.verify(
    "HMAC",
    await unsubscribeHmacKey(secret),
    bytesToArrayBuffer(signature),
    new TextEncoder().encode(`${UNSUBSCRIBE_PURPOSE}:${payload}`),
  );
  if (!valid) return null;
  const workspaceId = new TextDecoder().decode(payloadBytes);
  return /^[A-Za-z0-9_-]{8,128}$/.test(workspaceId) ? workspaceId : null;
}

export async function nurtureUnsubscribeUrl(
  workspaceId: string,
  secret: string,
): Promise<string> {
  const token = await createNurtureUnsubscribeToken(workspaceId, secret);
  return `${UNSUBSCRIBE_BASE_URL}?token=${encodeURIComponent(token)}`;
}
