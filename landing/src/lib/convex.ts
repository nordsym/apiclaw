// Thin Convex caller used by Next.js route handlers.
// Mirrors the inline fetch pattern in clerk-bridge — wrapped here to keep
// downstream routes terse.

const CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL ||
  "https://adventurous-avocet-799.convex.cloud";

type ConvexEnvelope<T> = { value: T } | T;

async function call<T>(kind: "mutation" | "query", path: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${CONVEX_URL}/api/${kind}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
    cache: "no-store",
  });
  const json = (await res.json()) as ConvexEnvelope<T> & { status?: string; errorMessage?: string };
  if (!res.ok) {
    const msg = (json as { errorMessage?: string })?.errorMessage || `convex ${kind} failed: ${res.status}`;
    throw new ConvexCallError(msg, res.status);
  }
  // Convex returns { status: "success", value: ... } or { status: "error", errorMessage }
  if ((json as { status?: string }).status === "error") {
    throw new ConvexCallError((json as { errorMessage?: string }).errorMessage || "convex error", 400);
  }
  return ((json as { value?: T }).value !== undefined ? (json as { value: T }).value : (json as T));
}

export class ConvexCallError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

export async function convexMutation<T = unknown>(path: string, args: Record<string, unknown>): Promise<T> {
  return call<T>("mutation", path, args);
}

export async function convexQuery<T = unknown>(path: string, args: Record<string, unknown>): Promise<T> {
  return call<T>("query", path, args);
}

export const CONVEX_BASE_URL = CONVEX_URL;
