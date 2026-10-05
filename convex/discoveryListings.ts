import { getManagedProviderAdapter } from "../src/product-truth";
import { getWorkspacePublicApi } from "../src/workspace-public-apis";
import { isPubliclyAvailableManagedProvider } from "./providerBoundaries";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import {
  query,
  mutation,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { findUsableAgentSession } from "./sessionSecurity";
import { listingMetadata, validateListing, listingCard } from "./listingPolicy";
import type { QueryCtx } from "./_generated/server";

async function owner(ctx: Pick<QueryCtx, "db">, token: string) {
  const session = await findUsableAgentSession(ctx.db, token);
  if (!session) throw Error("Invalid or expired session");
  const ws = await ctx.db.get(session.workspaceId);
  if (!ws || ws.status !== "active") throw Error("Workspace is not active");
  return session.workspaceId;
}
// Import budget is workspace-scoped, separate from paid execution quotas.
export const importPermit = mutation({
  args: { token: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const workspaceId = await owner(ctx, args.token);
    const key = `listing-import:${workspaceId}`;
    const hourBucket = Math.floor(Date.now() / 3600000);
    const row = await ctx.db
      .query("rateLimits")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    if (row?.hourBucket === hourBucket && row.count >= 30) return false;
    if (row)
      await ctx.db.patch(row._id, {
        hourBucket,
        count: row.hourBucket === hourBucket ? row.count + 1 : 1,
      });
    else
      await ctx.db.insert("rateLimits", {
        key,
        identifier: workspaceId,
        action: "listing-import",
        count: 1,
        hourBucket,
        createdAt: Date.now(),
      });
    return true;
  },
});
export const mine = query({
  args: { token: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const workspaceId = await owner(ctx, args.token);
    return ctx.db
      .query("discoveryListings")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .take(50);
  },
});
export const saveDraft = mutation({
  args: {
    token: v.string(),
    id: v.optional(v.id("discoveryListings")),
    revision: v.optional(v.number()),
    metadata: listingMetadata,
  },
  returns: v.id("discoveryListings"),
  handler: async (ctx, args) => {
    const workspaceId = await owner(ctx, args.token);
    validateListing(args.metadata);
    const nameKey = args.metadata.name.trim().toLowerCase();
    if (args.id) {
      const row = await ctx.db.get(args.id);
      if (!row || row.workspaceId !== workspaceId)
        throw Error("Listing not found");
      if (row.revision !== args.revision)
        throw Error("Listing changed. Reload before editing.");
      // Stable name prevents a reviewed identity being reassigned through updates.
      if (row.nameKey !== nameKey)
        throw Error(
          "Keep the listing name. Create a separate listing for another API.",
        );
      await ctx.db.patch(row._id, {
        draft: args.metadata,
        revision: row.revision + 1,
        reviewState: "draft",
        reviewNote: undefined,
        updatedAt: Date.now(),
      });
      return row._id;
    }
    const existing = await ctx.db
      .query("discoveryListings")
      .withIndex("by_workspace_name", (q) =>
        q.eq("workspaceId", workspaceId).eq("nameKey", nameKey),
      )
      .first();
    if (existing)
      throw Error(
        "A listing with this name already exists. Open it from My APIs.",
      );
    const rows = await ctx.db
      .query("discoveryListings")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .take(50);
    if (rows.length >= 50) throw Error("Workspace listing limit reached");
    return ctx.db.insert("discoveryListings", {
      workspaceId,
      nameKey,
      draft: args.metadata,
      revision: 1,
      reviewState: "draft",
      isPublished: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
export const submit = mutation({
  args: {
    token: v.string(),
    id: v.id("discoveryListings"),
    revision: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workspaceId = await owner(ctx, args.token);
    const row = await ctx.db.get(args.id);
    if (!row || row.workspaceId !== workspaceId)
      throw Error("Listing not found");
    if (row.revision !== args.revision)
      throw Error("Listing changed. Reload before submitting.");
    validateListing(row.draft);
    if (row.reviewState === "pending") return null;
    await ctx.db.patch(row._id, {
      reviewState: "pending",
      reviewNote: undefined,
      updatedAt: Date.now(),
    });
    return null;
  },
});
export const unpublish = mutation({
  args: { token: v.string(), id: v.id("discoveryListings") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workspaceId = await owner(ctx, args.token);
    const row = await ctx.db.get(args.id);
    if (!row || row.workspaceId !== workspaceId)
      throw Error("Listing not found");
    await ctx.db.patch(row._id, {
      isPublished: false,
      published: undefined,
      reviewState: "draft",
      revision: row.revision + 1,
      updatedAt: Date.now(),
    });
    return null;
  },
});
// Only authenticated deployment operators can review. There is no public approval mutation.
export const pending = internalQuery({
  args: { paginationOpts: paginationOptsValidator },
  returns: v.any(),
  handler: async (ctx, args) =>
    ctx.db
      .query("discoveryListings")
      .withIndex("by_review", (q) => q.eq("reviewState", "pending"))
      .paginate(args.paginationOpts),
});
export const review = internalMutation({
  args: {
    id: v.id("discoveryListings"),
    revision: v.number(),
    approve: v.boolean(),
    reviewer: v.string(),
    note: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (
      !args.reviewer.trim() ||
      !args.note.trim() ||
      args.note.length > 2000 ||
      args.reviewer.length > 150
    )
      throw Error("Reviewer and ownership/content review evidence required");
    const row = await ctx.db.get(args.id);
    if (!row || row.reviewState !== "pending" || row.revision !== args.revision)
      throw Error("Review is stale or listing is not pending");
    validateListing(row.draft);
    if (args.approve) {
      if (
        getManagedProviderAdapter(row.draft.name) ||
        getWorkspacePublicApi(row.draft.name)
      )
        throw Error(
          "This name belongs to an existing execution integration; review it separately",
        );
      if (
        [row.draft.name, row.draft.baseUrl, row.draft.docsUrl].some(
          (value) => !isPubliclyAvailableManagedProvider(value),
        )
      )
        throw Error("Listing conflicts with public discovery boundaries");
      const duplicates = await ctx.db
        .query("discoveryListings")
        .withIndex("by_name", (q) => q.eq("nameKey", row.nameKey))
        .take(100);
      if (
        duplicates.length === 100 ||
        duplicates.some((r) => r._id !== row._id && r.isPublished)
      )
        throw Error("Duplicate listing name requires review");
    }
    await ctx.db.patch(row._id, {
      reviewState: args.approve ? "approved" : "changes_requested",
      reviewedRevision: row.revision,
      reviewedBy: args.reviewer,
      reviewNote: args.note,
      reviewedAt: Date.now(),
      updatedAt: Date.now(),
      ...(args.approve ? { published: row.draft, isPublished: true } : {}),
    });
    return null;
  },
});
// Deliberately projects only the approved snapshot. No drafts, workspace IDs or review notes.
export const published = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: v.any(),
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("discoveryListings")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .paginate(args.paginationOpts);
    return {
      ...result,
      page: result.page
        .filter((r) => r.published)
        .map((r) => listingCard(r._id, r.published!)),
    };
  },
});
