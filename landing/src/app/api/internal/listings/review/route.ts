import { NextRequest } from "next/server";
import { convexMutation } from "@/lib/convex";
import {
  authorizeListingAgent,
  operatorJson,
  listingReviewFailure,
  readListingReview,
} from "@/lib/listing-operator-api";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeListingAgent(req);
    if (auth.response) return auth.response;
    const parsed = await readListingReview(req);
    if (parsed.response) return parsed.response;
    await convexMutation("discoveryListings:operatorReview", {
      ...auth.credentials,
      ...parsed.review,
    });
    return operatorJson({
      ok: true,
      ...parsed.review,
      reviewer: auth.credentials!.reviewer,
    });
  } catch (error) {
    return listingReviewFailure(error);
  }
}
