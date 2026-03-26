import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
// Get MOU by partnerId
export const getByPartnerId = query({
    args: { partnerId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("mouDocuments")
            .withIndex("by_partnerId", (q) => q.eq("partnerId", args.partnerId))
            .first();
    },
});
// Create new MOU document
export const create = mutation({
    args: {
        partnerId: v.string(),
        partnerName: v.string(),
        partnerEmail: v.string(),
        documentHtml: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("mouDocuments", {
            ...args,
            status: "pending",
            createdAt: Date.now(),
        });
    },
});
// Sign MOU
export const sign = mutation({
    args: {
        partnerId: v.string(),
        signatureDataUrl: v.string(),
        signerName: v.string(),
        signerTitle: v.string(),
        signerIp: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const mou = await ctx.db
            .query("mouDocuments")
            .withIndex("by_partnerId", (q) => q.eq("partnerId", args.partnerId))
            .first();
        if (!mou) {
            throw new Error("MOU not found");
        }
        if (mou.status === "signed") {
            throw new Error("MOU already signed");
        }
        await ctx.db.patch(mou._id, {
            status: "signed",
            signedAt: Date.now(),
            signatureDataUrl: args.signatureDataUrl,
            signerName: args.signerName,
            signerTitle: args.signerTitle,
            signerIp: args.signerIp,
        });
        return { success: true };
    },
});
// List all MOUs (admin)
export const list = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("mouDocuments").collect();
    },
});
// Delete MOU (admin)
export const remove = mutation({
    args: { partnerId: v.string() },
    handler: async (ctx, args) => {
        const mou = await ctx.db
            .query("mouDocuments")
            .withIndex("by_partnerId", (q) => q.eq("partnerId", args.partnerId))
            .first();
        if (mou) {
            await ctx.db.delete(mou._id);
            return { success: true, deleted: args.partnerId };
        }
        return { success: false, message: "MOU not found" };
    },
});
//# sourceMappingURL=mou.js.map