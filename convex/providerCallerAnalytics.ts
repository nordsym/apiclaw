// Pure helpers for provider inbound-caller analytics (per-caller breakdown
// on getProviderAnalytics). Kept free of Convex imports so they can be
// unit tested directly without a Convex runtime.

export interface CallerLogRow {
  callerWorkspaceId?: string;
  status: string;
  createdAt: number;
}

export interface ByCallerEntry {
  callerKey: string;
  calls: number;
  errors: number;
  lastCallAt: number;
}

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/**
 * Deterministic, non-cryptographic FNV-1a hash to an 8-hex-char string.
 *
 * Convex queries run in a restricted runtime where `crypto.subtle` is only
 * available inside actions, not queries (getProviderAnalytics is a query).
 * We therefore cannot reuse the SHA-256 `hashKey` pattern from apiKeys.ts
 * here. FNV-1a is not cryptographically secure, but callerWorkspaceId is a
 * high-entropy Convex document id, not a secret or a low-entropy value an
 * attacker could brute-force meaningfully from an 8-hex-char digest in this
 * context -- it's sufficient to avoid echoing the raw id back to another
 * tenant while staying stable across calls.
 */
export function fnv1aHex(input: string): string {
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/** Derive the caller label shown to the provider owner. */
export function callerKeyFor(callerWorkspaceId: string, ownWorkspaceId: string): string {
  if (callerWorkspaceId === ownWorkspaceId) return "you";
  return `ws-${fnv1aHex(callerWorkspaceId)}`;
}

/**
 * Aggregate inbound logs into a per-caller breakdown: sorted by calls desc,
 * capped at maxEntries, raw callerWorkspaceId never included in the output.
 */
export function computeByCaller(
  logs: CallerLogRow[],
  ownWorkspaceId: string,
  maxEntries = 25
): ByCallerEntry[] {
  const byKey: Record<string, ByCallerEntry> = {};
  for (const log of logs) {
    if (!log.callerWorkspaceId) continue;
    const callerKey = callerKeyFor(log.callerWorkspaceId, ownWorkspaceId);
    const entry = byKey[callerKey] ?? { callerKey, calls: 0, errors: 0, lastCallAt: 0 };
    entry.calls++;
    if (log.status === "error") entry.errors++;
    if (log.createdAt > entry.lastCallAt) entry.lastCallAt = log.createdAt;
    byKey[callerKey] = entry;
  }
  return Object.values(byKey)
    .sort((a, b) => b.calls - a.calls)
    .slice(0, maxEntries);
}
