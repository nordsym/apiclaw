import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { convexMutation } from "@/lib/convex";

export const operatorJson = (body: unknown, status = 200, headers = {}) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, private", ...headers },
  });

export async function authorizeListingAgent(req: NextRequest) {
  const expected = process.env.APICLAW_OPERATOR_TOKEN;
  const supplied = req.headers
    .get("authorization")
    ?.match(/^Bearer ([^\s]+)$/i)?.[1];
  const digest = (s: string) => createHash("sha256").update(s).digest();
  if (
    !expected ||
    !supplied ||
    supplied.length > 512 ||
    !timingSafeEqual(digest(expected), digest(supplied))
  )
    return {
      response: operatorJson({ error: "Operator bearer token required" }, 401),
    };
  const agent = req.headers.get("X-APIClaw-Agent") ?? "unknown";
  if (!/^[A-Za-z0-9][A-Za-z0-9 ._-]{0,63}$/.test(agent))
    return {
      response: operatorJson(
        { error: "Invalid X-APIClaw-Agent (1-64 plain characters)" },
        400,
      ),
    };
  const internalSecret = process.env.APICLAW_INTERNAL_SECRET;
  if (!internalSecret)
    return {
      response: operatorJson({ error: "Operator bridge unavailable" }, 503),
    };
  const credentials = { internalSecret, reviewer: "operator-token:" + agent };
  const budget = await convexMutation<{ allowed: boolean; retryAfter: number }>(
    "discoveryListings:operatorPermit",
    credentials,
  );
  if (!budget.allowed)
    return {
      response: operatorJson({ error: "Operator request limit reached" }, 429, {
        "Retry-After": String(budget.retryAfter),
      }),
    };
  return { credentials };
}

export function listingReviewFailure(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const code = (error as { data?: { code?: string } } | null)?.data?.code;
  if (code === "LISTING_REVIEW_STALE" || /LISTING_REVIEW_STALE|Review is stale|^stale$/.test(message))
    return operatorJson(
      {
        error:
          "This revision is stale or no longer pending. Refresh the queue before reviewing.",
      },
      409,
    );
  if (
    /requires review|conflicts with public|existing execution integration|Reviewer and ownership/.test(
      message,
    )
  )
    return operatorJson(
      {
        error:
          "Listing policy prevents this decision. Check ownership, metadata and duplicate names.",
      },
      400,
    );
  return operatorJson(
    {
      error:
        "Review service unavailable. Your decision was not confirmed. Refresh the queue before retrying.",
    },
    503,
  );
}

export async function readListingReview(req: NextRequest) {
  const text = await req.text();
  if (text.length > 5000)
    return { response: operatorJson({ error: "Request too large" }, 413) };
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return { response: operatorJson({ error: "Invalid JSON" }, 400) };
  }
  const { id, revision, approve, note } = body ?? {};
  if (
    typeof id !== "string" ||
    !/^[A-Za-z0-9;_-]{1,64}$/.test(id) ||
    !Number.isSafeInteger(revision) ||
    revision < 1 ||
    typeof approve !== "boolean" ||
    typeof note !== "string" ||
    !note.trim() ||
    note.length > 2000
  )
    return {
      response: operatorJson(
        {
          error:
            "Listing id, exact revision, boolean approve and non-empty note (up to 2000 characters) required",
        },
        400,
      ),
    };
  return { review: { id, revision, approve, note: note.trim() } };
}
