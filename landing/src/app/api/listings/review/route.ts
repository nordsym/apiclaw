import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { isListingOperator } from "@/lib/listing-review-auth";
import { convexQuery, convexMutation } from "@/lib/convex";
export const runtime = "nodejs";
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, private" },
  });
async function operator() {
  if (!isListingOperator(await currentUser())) return null;
  const internalSecret = process.env.APICLAW_INTERNAL_SECRET;
  if (!internalSecret) throw Error("Operator bridge unavailable");
  return { internalSecret, reviewer: "gustav@nordsym.com" };
}
export async function GET(req: NextRequest) {
  try {
    const credentials = await operator();
    if (!credentials) return json({ error: "Operator access required" }, 403);
    return json(
      await convexQuery("discoveryListings:operatorPending", {
        ...credentials,
        ...(req.nextUrl.searchParams.get("listing")
          ? { id: req.nextUrl.searchParams.get("listing") }
          : {}),
        paginationOpts: {
          numItems: 25,
          cursor: req.nextUrl.searchParams.get("cursor") || null,
        },
      }),
    );
  } catch {
    return json({ error: "Could not load review queue" }, 503);
  }
}
export async function POST(req: NextRequest) {
  if (
    req.headers.get("origin") !== req.nextUrl.origin ||
    (req.headers.get("sec-fetch-site") &&
      req.headers.get("sec-fetch-site") !== "same-origin")
  )
    return json({ error: "Forbidden" }, 403);
  try {
    const credentials = await operator();
    if (!credentials) return json({ error: "Operator access required" }, 403);
    const body = await req.text();
    if (body.length > 5000) return json({ error: "Request too large" }, 413);
    const { id, revision, approve, note } = JSON.parse(body);
    if (
      typeof id !== "string" ||
      !Number.isSafeInteger(revision) ||
      revision < 1 ||
      typeof approve !== "boolean" ||
      typeof note !== "string" ||
      !note.trim() ||
      note.length > 2000
    )
      return json(
        { error: "Listing, exact revision and review note required" },
        400,
      );
    await convexMutation("discoveryListings:operatorReview", {
      ...credentials,
      id,
      revision,
      approve,
      note: note.trim(),
    });
    return json({ ok: true });
  } catch {
    return json(
      {
        error:
          "Review failed. The submission may have changed or conflict with listing policy. Reload and review again.",
      },
      409,
    );
  }
}
