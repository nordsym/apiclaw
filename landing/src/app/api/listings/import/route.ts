import { NextRequest, NextResponse } from "next/server";
import { parseListingSpec, SPEC_LIMIT } from "@/lib/listing-import";
import { fetchListingSpec } from "@/lib/listing-fetch";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const reply = (body: unknown, status = 200) =>
    NextResponse.json(body, {
      status,
      headers: { "Cache-Control": "no-store" },
    });
  if (
    req.headers.get("origin") &&
    req.headers.get("origin") !== req.nextUrl.origin
  )
    return reply({ error: "Invalid origin" }, 403);
  const token = req.headers.get("X-APIClaw-Session");
  if (!token) return reply({ error: "Sign in to import an API" }, 401);
  try {
    const auth = await fetch(
      `${process.env.NEXT_PUBLIC_CONVEX_URL || "https://adventurous-avocet-799.convex.cloud"}/api/mutation`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "discoveryListings:importPermit",
          args: { token },
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      },
    );
    const result = await auth.json();
    if (!auth.ok || result.status !== "success")
      return reply({ error: "Invalid or expired session" }, 401);
    if (result.value !== true)
      return reply(
        { error: "Import limit reached. Try again next hour." },
        429,
      );
    const reader = req.body?.getReader();
    if (!reader) return reply({ error: "Provide a specification" }, 400);
    let size = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > SPEC_LIMIT + 10000) {
        await reader.cancel();
        return reply({ error: "Upload exceeds 1 MB" }, 413);
      }
      chunks.push(value);
    }
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if ((typeof body.url === "string") === (typeof body.text === "string"))
      throw Error("Provide exactly one URL or file");
    const text =
      typeof body.url === "string"
        ? await fetchListingSpec(body.url)
        : body.text;
    return reply({
      metadata: parseListingSpec(
        text,
        typeof body.url === "string" ? body.url : undefined,
      ),
    });
  } catch (error) {
    return reply(
      { error: error instanceof Error ? error.message : "Import failed" },
      400,
    );
  }
}
