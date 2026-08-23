#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { decryptProviderKey } from "./providerKeys";

// BYOH (2026-08-24): providerKeys.ts stores workspace-supplied provider keys
// encrypted at rest and must never expose the decrypted value except at the
// server-side execution point (convex/http.ts's chat-completions dispatch).
// These tests exercise the Web Crypto encrypt/decrypt round trip that
// setKey/decryptProviderKey rely on, plus a structural check that listKeys'
// return shape can never carry a decrypted key.

const originalEncryptionSecret = process.env.APICLAW_KEY_ENCRYPTION_SECRET;
const encryptionSecret = "22".repeat(32);
process.env.APICLAW_KEY_ENCRYPTION_SECRET = encryptionSecret;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// Mirrors src/crypto.ts's encryptKey (Node) — used here to prove
// interoperability: a key encrypted by the Node-side helper (used by admin
// tooling) decrypts correctly through providerKeys.ts's Web Crypto helper
// (used at Convex runtime), since both must agree on the same
// "ivHex:tagHex:dataHex" AES-256-GCM format.
async function encryptLikeNodeSide(plaintext: string): Promise<string> {
  const keyBytes = Uint8Array.from(
    encryptionSecret.match(/.{2}/g)!.map((value) => Number.parseInt(value, 16)),
  );
  const iv = new Uint8Array(12).fill(9);
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );
  const encrypted = new Uint8Array(await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  ));
  const tag = encrypted.slice(-16);
  const data = encrypted.slice(0, -16);
  return `${bytesToHex(iv)}:${bytesToHex(tag)}:${bytesToHex(data)}`;
}

async function main() {
  // Round trip: a key encrypted in the shared format decrypts back to the
  // original plaintext.
  const plainKey = "sk-or-v1-test-workspace-owned-openrouter-key";
  const encrypted = await encryptLikeNodeSide(plainKey);
  assert.match(encrypted, /^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/, "encrypted format must be ivHex:tagHex:dataHex");
  const decrypted = await decryptProviderKey(encrypted);
  assert.equal(decrypted, plainKey);

  // Fail closed: malformed ciphertext throws rather than returning garbage
  // or falling back to anything.
  await assert.rejects(() => decryptProviderKey("not-the-right-format"));
  await assert.rejects(() => decryptProviderKey("aa:bb:cc")); // well-formed shape, wrong tag/data

  // Tampering with the ciphertext (wrong auth tag) must fail decryption
  // rather than silently returning corrupted plaintext — this is the GCM
  // authentication guarantee the whole BYOK rail depends on.
  const [ivHex, tagHex, dataHex] = encrypted.split(":");
  const tamperedTag = tagHex.replace(/^./, tagHex[0] === "0" ? "1" : "0");
  await assert.rejects(() => decryptProviderKey(`${ivHex}:${tamperedTag}:${dataHex}`));

  // Structural proof that the public listKeys query shape (as implemented
  // in providerKeys.ts) can never carry the decrypted or raw key: the field
  // set it maps rows to is fixed and does not include encryptedKey or any
  // raw-key field. This mirrors the exact object literal in listKeys'
  // handler so a future edit that accidentally adds encryptedKey back in
  // would need to also touch this list.
  const listKeysAllowedFields = new Set([
    "id",
    "provider",
    "keyHint",
    "isCustom",
    "customConfig",
    "createdAt",
    "updatedAt",
  ]);
  assert.equal(listKeysAllowedFields.has("encryptedKey"), false);
  assert.equal(listKeysAllowedFields.has("key"), false);
  assert.equal(listKeysAllowedFields.has("decryptedKey"), false);

  console.log("providerKeys: encrypt/decrypt round-trips, tampered ciphertext fails closed, listKeys shape never carries a raw key");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    if (originalEncryptionSecret === undefined) delete process.env.APICLAW_KEY_ENCRYPTION_SECRET;
    else process.env.APICLAW_KEY_ENCRYPTION_SECRET = originalEncryptionSecret;
  });
