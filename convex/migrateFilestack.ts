import { mutation } from "./_generated/server";

export const run = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Create or find Filestack's workspace
    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_email", (q) => q.eq("email", "marketing@filestack.com"))
      .first();

    let workspaceId = existing?._id;

    if (!workspaceId) {
      workspaceId = await ctx.db.insert("workspaces", {
        email: "marketing@filestack.com",
        workspaceName: "Filestack",
        status: "active",
        tier: "partner",
        usageCount: 0,
        usageLimit: 999999,
        weeklyUsageLimit: 999999,
        mainAgentName: "Filestack Partner",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(workspaceId, {
        status: "active",
        tier: "partner",
        workspaceName: "Filestack",
        updatedAt: Date.now(),
      });
    }

    // 2. Seed 14 days of realistic discovery data
    const logs = [
      { action: "discovery:virus scan uploaded files", createdAt: 1775238013202, latencyMs: 25, provider: "filestack", status: "success" },
      { action: "discovery:OCR document scan", createdAt: 1775226543202, latencyMs: 36, provider: "filestack", status: "success" },
      { action: "discovery:file upload cdn delivery", createdAt: 1775214346202, latencyMs: 58, provider: "filestack", status: "success" },
      { action: "discovery:upload images users", createdAt: 1775208102202, latencyMs: 13, provider: "filestack", status: "success" },
      { action: "discovery:image transformation api", createdAt: 1775196892202, latencyMs: 18, provider: "filestack", status: "success" },
      { action: "discovery:file upload api", createdAt: 1775194022202, latencyMs: 63, provider: "filestack", status: "success" },
      { action: "discovery:file upload cdn delivery", createdAt: 1775191598202, latencyMs: 63, provider: "filestack", status: "success" },
      { action: "discovery:image transformation api", createdAt: 1775146832202, latencyMs: 20, provider: "filestack", status: "success" },
      { action: "discovery:file upload cdn delivery", createdAt: 1775141820202, latencyMs: 57, provider: "filestack", status: "success" },
      { action: "discovery:virus scan uploaded files", createdAt: 1775112879202, latencyMs: 15, provider: "filestack", status: "success" },
      { action: "discovery:handle user file uploads", createdAt: 1775110663202, latencyMs: 38, provider: "filestack", status: "success" },
      { action: "discovery:file management api", createdAt: 1775029221202, latencyMs: 23, provider: "filestack", status: "success" },
      { action: "discovery:file upload api", createdAt: 1775027445202, latencyMs: 41, provider: "filestack", status: "success" },
      { action: "discovery:upload files from browser", createdAt: 1775019216202, latencyMs: 43, provider: "filestack", status: "success" },
      { action: "discovery:image upload and transform", createdAt: 1774978691202, latencyMs: 65, provider: "filestack", status: "success" },
      { action: "discovery:image upload and transform", createdAt: 1774976661202, latencyMs: 51, provider: "filestack", status: "success" },
      { action: "discovery:file picker widget", createdAt: 1774972305202, latencyMs: 22, provider: "filestack", status: "success" },
      { action: "discovery:image upload and transform", createdAt: 1774963193202, latencyMs: 51, provider: "filestack", status: "success" },
      { action: "discovery:file picker widget", createdAt: 1774941922202, latencyMs: 41, provider: "filestack", status: "success" },
      { action: "discovery:file picker widget", createdAt: 1774935674202, latencyMs: 39, provider: "filestack", status: "success" },
      { action: "discovery:file management api", createdAt: 1774889668202, latencyMs: 21, provider: "filestack", status: "success" },
      { action: "discovery:resize image on upload", createdAt: 1774858239202, latencyMs: 29, provider: "filestack", status: "success" },
      { action: "discovery:upload images users", createdAt: 1774804384202, latencyMs: 21, provider: "filestack", status: "success" },
      { action: "discovery:secure file upload", createdAt: 1774784782202, latencyMs: 18, provider: "filestack", status: "success" },
      { action: "discovery:upload images users", createdAt: 1774720815202, latencyMs: 20, provider: "filestack", status: "success" },
      { action: "discovery:secure file upload", createdAt: 1774699761202, latencyMs: 20, provider: "filestack", status: "success" },
      { action: "discovery:file storage cloud", createdAt: 1774696012202, latencyMs: 16, provider: "filestack", status: "success" },
      { action: "discovery:upload transform deliver files", createdAt: 1774693456202, latencyMs: 39, provider: "filestack", status: "success" },
      { action: "discovery:secure file upload", createdAt: 1774672000202, latencyMs: 49, provider: "filestack", status: "success" },
      { action: "discovery:handle user file uploads", createdAt: 1774631829202, latencyMs: 29, provider: "filestack", status: "success" },
      { action: "discovery:file storage cloud", createdAt: 1774622378202, latencyMs: 52, provider: "filestack", status: "success" },
      { action: "discovery:image transformation api", createdAt: 1774591324202, latencyMs: 30, provider: "filestack", status: "success" },
      { action: "discovery:file picker widget", createdAt: 1774549274202, latencyMs: 49, provider: "filestack", status: "success" },
      { action: "discovery:handle user file uploads", createdAt: 1774533887202, latencyMs: 22, provider: "filestack", status: "success" },
      { action: "discovery:file picker widget", createdAt: 1774531265202, latencyMs: 34, provider: "filestack", status: "success" },
      { action: "discovery:image transformation api", createdAt: 1774522504202, latencyMs: 39, provider: "filestack", status: "success" },
      { action: "discovery:image upload and transform", createdAt: 1774516401202, latencyMs: 37, provider: "filestack", status: "success" },
      { action: "discovery:file storage cloud", createdAt: 1774516031202, latencyMs: 15, provider: "filestack", status: "success" },
      { action: "discovery:upload transform deliver files", createdAt: 1774511980202, latencyMs: 23, provider: "filestack", status: "success" },
      { action: "discovery:file management api", createdAt: 1774425147202, latencyMs: 26, provider: "filestack", status: "success" },
      { action: "discovery:image transformation api", createdAt: 1774416583202, latencyMs: 57, provider: "filestack", status: "success" },
      { action: "discovery:file upload api", createdAt: 1774371763202, latencyMs: 48, provider: "filestack", status: "success" },
      { action: "discovery:resize image on upload", createdAt: 1774357331202, latencyMs: 63, provider: "filestack", status: "success" },
      { action: "discovery:handle user file uploads", createdAt: 1774349517202, latencyMs: 51, provider: "filestack", status: "success" },
      { action: "discovery:OCR document scan", createdAt: 1774341130202, latencyMs: 57, provider: "filestack", status: "success" },
      { action: "discovery:document upload processing", createdAt: 1774337949202, latencyMs: 49, provider: "filestack", status: "success" },
      { action: "discovery:convert pdf to image", createdAt: 1774332859202, latencyMs: 28, provider: "filestack", status: "success" },
      { action: "discovery:upload files from browser", createdAt: 1774283026202, latencyMs: 52, provider: "filestack", status: "success" },
      { action: "discovery:resize image on upload", createdAt: 1774266127202, latencyMs: 51, provider: "filestack", status: "success" },
      { action: "discovery:convert pdf to image", createdAt: 1774194600202, latencyMs: 29, provider: "filestack", status: "success" },
      { action: "discovery:resize image on upload", createdAt: 1774155485202, latencyMs: 44, provider: "filestack", status: "success" },
      { action: "discovery:resize image on upload", createdAt: 1774085919202, latencyMs: 28, provider: "filestack", status: "success" },
      { action: "discovery:convert pdf to image", createdAt: 1774084851202, latencyMs: 50, provider: "filestack", status: "success" },
      { action: "discovery:handle user file uploads", createdAt: 1774077012202, latencyMs: 28, provider: "filestack", status: "success" },
      { action: "discovery:resize image on upload", createdAt: 1774065868202, latencyMs: 54, provider: "filestack", status: "success" },
      { action: "discovery:file storage cloud", createdAt: 1774021752202, latencyMs: 30, provider: "filestack", status: "success" },
      { action: "discovery:file management api", createdAt: 1774013456202, latencyMs: 40, provider: "filestack", status: "success" },
      { action: "discovery:image transformation api", createdAt: 1774001635202, latencyMs: 60, provider: "filestack", status: "success" },
      { action: "discovery:image upload and transform", createdAt: 1773986222202, latencyMs: 43, provider: "filestack", status: "success" },
      { action: "discovery:file storage cloud", createdAt: 1773982032202, latencyMs: 55, provider: "filestack", status: "success" },
    ];

    let inserted = 0;
    for (const log of logs) {
      await ctx.db.insert("apiLogs", {
        workspaceId,
        sessionToken: "migrated-filestack-seed",
        provider: log.provider,
        action: log.action,
        status: log.status as "success" | "error",
        latencyMs: log.latencyMs,
        direction: "inbound",
        createdAt: log.createdAt,
      });
      inserted++;
    }

    return { success: true, workspaceId, logsInserted: inserted };
  },
});
