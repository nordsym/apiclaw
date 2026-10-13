import { NextRequest } from "next/server";
import { convexQuery } from "@/lib/convex";
import {
  authorizeListingAgent,
  operatorJson,
} from "@/lib/listing-operator-api";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  try {
    const auth = await authorizeListingAgent(req);
    if (auth.response) return auth.response;
    const result = await convexQuery<any>("discoveryListings:operatorPending", {
      ...auth.credentials,
      ...(req.nextUrl.searchParams.get("id")
        ? { id: req.nextUrl.searchParams.get("id") }
        : {}),
      paginationOpts: {
        numItems: 25,
        cursor: req.nextUrl.searchParams.get("cursor") || null,
      },
    });
    return operatorJson({
      listings: result.page.map((row: any) => ({
        id: row._id,
        name: row.draft.name,
        revision: row.revision,
        docsUrl: row.draft.docsUrl,
        baseUrl: row.draft.baseUrl,
        submittedAt: row.submittedAt ?? row.updatedAt,
        submitter: { workspaceId: row.workspaceId, email: row.submitter },
      })),
      nextCursor: result.isDone ? null : result.continueCursor,
    });
  } catch {
    return operatorJson({ error: "Could not load pending listings" }, 503);
  }
}
