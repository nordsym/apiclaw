import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const run = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Create or find Pratham's workspace
    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_email", (q) => q.eq("email", "pratham.kumar@apilayer.com"))
      .first();

    let workspaceId = existing?._id;

    if (!workspaceId) {
      workspaceId = await ctx.db.insert("workspaces", {
        email: "pratham.kumar@apilayer.com",
        workspaceName: "APILayer",
        status: "active",
        tier: "partner",
        usageCount: 0,
        usageLimit: 999999,
        weeklyUsageLimit: 999999,
        mainAgentName: "APILayer Partner",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(workspaceId, {
        status: "active",
        tier: "partner",
        workspaceName: "APILayer",
        updatedAt: Date.now(),
      });
    }

    // 2. Migrate all logs from DEV (exact timestamps preserved)
    const logs = [
      { action: "discovery:news articles media", createdAt: 1774967391726, latencyMs: 23, provider: "apilayer", status: "success" },
      { action: "discovery:geocoding address", createdAt: 1774967387957, latencyMs: 20, provider: "apilayer", status: "success" },
      { action: "discovery:cryptocurrency bitcoin rates", createdAt: 1774967384524, latencyMs: 42, provider: "apilayer", status: "success" },
      { action: "discovery:language detection", createdAt: 1774967381009, latencyMs: 24, provider: "apilayer", status: "success" },
      { action: "discovery:financial news", createdAt: 1774967377825, latencyMs: 27, provider: "apilayer", status: "success" },
      { action: "discovery:PDF convert HTML", createdAt: 1774967373814, latencyMs: 18, provider: "apilayer", status: "success" },
      { action: "discovery:email verification", createdAt: 1774967370630, latencyMs: 20, provider: "apilayer", status: "success" },
      { action: "discovery:screenshot website", createdAt: 1774967363406, latencyMs: 6, provider: "apilayer", status: "success" },
      { action: "discovery:VAT validation", createdAt: 1774967355249, latencyMs: 6, provider: "apilayer", status: "success" },
      { action: "discovery:flight aviation tracking", createdAt: 1774967352176, latencyMs: 21, provider: "apilayer", status: "success" },
      { action: "discovery:IP geolocation", createdAt: 1774967347709, latencyMs: 32, provider: "apilayer", status: "success" },
      { action: "discovery:currency exchange rates", createdAt: 1774967344273, latencyMs: 20, provider: "apilayer", status: "success" },
      { action: "discovery:weather forecast", createdAt: 1774967340888, latencyMs: 18, provider: "apilayer", status: "success" },
      { action: "discovery:news articles media", createdAt: 1774939258553, latencyMs: 19, provider: "apilayer", status: "success" },
      { action: "discovery:geocoding address", createdAt: 1774939258311, latencyMs: 11, provider: "apilayer", status: "success" },
      { action: "discovery:cryptocurrency bitcoin rates", createdAt: 1774939258096, latencyMs: 18, provider: "apilayer", status: "success" },
      { action: "discovery:language detection", createdAt: 1774939257877, latencyMs: 15, provider: "apilayer", status: "success" },
      { action: "discovery:financial news", createdAt: 1774939257704, latencyMs: 15, provider: "apilayer", status: "success" },
      { action: "discovery:PDF convert HTML", createdAt: 1774939257462, latencyMs: 18, provider: "apilayer", status: "success" },
      { action: "discovery:email verification", createdAt: 1774939257256, latencyMs: 15, provider: "apilayer", status: "success" },
      { action: "discovery:screenshot website", createdAt: 1774939256831, latencyMs: 15, provider: "apilayer", status: "success" },
      { action: "discovery:VAT validation", createdAt: 1774939256477, latencyMs: 12, provider: "apilayer", status: "success" },
      { action: "discovery:flight aviation tracking", createdAt: 1774939256184, latencyMs: 11, provider: "apilayer", status: "success" },
      { action: "discovery:IP geolocation", createdAt: 1774939255985, latencyMs: 10, provider: "apilayer", status: "success" },
      { action: "discovery:currency exchange rates", createdAt: 1774939255834, latencyMs: 13, provider: "apilayer", status: "success" },
      { action: "discovery:weather forecast", createdAt: 1774939255695, latencyMs: 18, provider: "apilayer", status: "success" },
      { action: "coinlayer_live", createdAt: 1774892789576, latencyMs: 792, provider: "apilayer", status: "success" },
      { action: "ipstack_lookup", createdAt: 1774892785050, latencyMs: 720, provider: "apilayer", status: "success" },
      { action: "ipstack_lookup", createdAt: 1774892780343, latencyMs: 651, provider: "apilayer", status: "success" },
      { action: "coinlayer_live", createdAt: 1774892775999, latencyMs: 712, provider: "apilayer", status: "success" },
      { action: "coinlayer_live", createdAt: 1774892771405, latencyMs: 987, provider: "apilayer", status: "success" },
      { action: "screenshot", createdAt: 1774890407860, latencyMs: 7721, provider: "apilayer", status: "success" },
      { action: "exchange_rates", createdAt: 1774890396532, latencyMs: 695, provider: "apilayer", status: "error", errorMessage: "Unexpected token" },
      { action: "discovery:news articles media", createdAt: 1774889743879, latencyMs: 17, provider: "apilayer", status: "success" },
      { action: "discovery:geocoding address", createdAt: 1774889740816, latencyMs: 16, provider: "apilayer", status: "success" },
      { action: "discovery:cryptocurrency bitcoin rates", createdAt: 1774889737259, latencyMs: 9, provider: "apilayer", status: "success" },
      { action: "discovery:language detection", createdAt: 1774889733933, latencyMs: 33, provider: "apilayer", status: "success" },
      { action: "discovery:financial news", createdAt: 1774889730874, latencyMs: 26, provider: "apilayer", status: "success" },
      { action: "discovery:PDF convert HTML", createdAt: 1774889727684, latencyMs: 21, provider: "apilayer", status: "success" },
      { action: "discovery:email verification", createdAt: 1774889723926, latencyMs: 21, provider: "apilayer", status: "success" },
      { action: "discovery:screenshot website", createdAt: 1774889717576, latencyMs: 12, provider: "apilayer", status: "success" },
      { action: "discovery:VAT validation", createdAt: 1774889710750, latencyMs: 14, provider: "apilayer", status: "success" },
      { action: "discovery:flight aviation tracking", createdAt: 1774889707975, latencyMs: 19, provider: "apilayer", status: "success" },
      { action: "discovery:IP geolocation", createdAt: 1774889705024, latencyMs: 13, provider: "apilayer", status: "success" },
      { action: "discovery:currency exchange rates", createdAt: 1774889701843, latencyMs: 30, provider: "apilayer", status: "success" },
      { action: "discovery:weather forecast", createdAt: 1774889699061, latencyMs: 54, provider: "apilayer", status: "success" },
      { action: "discovery:foreign exchange forex rates fixer", createdAt: 1774886193681, latencyMs: 13, provider: "apilayer", status: "success" },
      { action: "discovery:browser detection user agent device", createdAt: 1774886193179, latencyMs: 17, provider: "apilayer", status: "success" },
      { action: "discovery:live news articles feed media", createdAt: 1774886192769, latencyMs: 12, provider: "apilayer", status: "success" },
      { action: "discovery:geocoding address coordinates latitude", createdAt: 1774886192364, latencyMs: 9, provider: "apilayer", status: "success" },
      { action: "discovery:cryptocurrency rates bitcoin ethereum", createdAt: 1774886191933, latencyMs: 9, provider: "apilayer", status: "success" },
      { action: "discovery:language detection identify text", createdAt: 1774886190674, latencyMs: 13, provider: "apilayer", status: "success" },
      { action: "discovery:financial news feed market", createdAt: 1774886190269, latencyMs: 13, provider: "apilayer", status: "success" },
      { action: "discovery:PDF generation convert HTML document", createdAt: 1774886189845, latencyMs: 20, provider: "apilayer", status: "success" },
      { action: "discovery:screenshot capture website page", createdAt: 1774886188241, latencyMs: 24, provider: "apilayer", status: "success" },
      { action: "discovery:VAT number validation EU business", createdAt: 1774886187407, latencyMs: 16, provider: "apilayer", status: "success" },
      { action: "discovery:flight tracking aviation status", createdAt: 1774886186950, latencyMs: 20, provider: "apilayer", status: "success" },
      { action: "discovery:IP address geolocation location", createdAt: 1774886186635, latencyMs: 17, provider: "apilayer", status: "success" },
      { action: "discovery:currency exchange rates conversion", createdAt: 1774886186135, latencyMs: 26, provider: "apilayer", status: "success" },
      { action: "discovery:weather forecast temperature", createdAt: 1774886185916, latencyMs: 20, provider: "apilayer", status: "success" },
      { action: "discovery:currency exchange rates", createdAt: 1774884654601, latencyMs: 12, provider: "apilayer", status: "success" },
      { action: "discovery:weather forecast", createdAt: 1774884654441, latencyMs: 33, provider: "apilayer", status: "success" },
      { action: "discovery:manual test from opus", createdAt: 1774884274160, latencyMs: 50, provider: "apilayer", status: "success" },
      { action: "coinlayer_live", createdAt: 1774809262760, latencyMs: 641, provider: "apilayer", status: "success" },
      { action: "ipstack_lookup", createdAt: 1774809261626, latencyMs: 663, provider: "apilayer", status: "success" },
      { action: "fixer_latest", createdAt: 1774809261011, latencyMs: 747, provider: "apilayer", status: "error", errorMessage: "Request failed" },
      { action: "weatherstack_current", createdAt: 1774808005255, latencyMs: 1181, provider: "apilayer", status: "success" },
    ];

    let inserted = 0;
    for (const log of logs) {
      await ctx.db.insert("apiLogs", {
        workspaceId,
        sessionToken: "migrated-from-dev",
        provider: log.provider,
        action: log.action,
        status: log.status as "success" | "error",
        latencyMs: log.latencyMs,
        direction: "inbound",
        errorMessage: (log as any).errorMessage,
        createdAt: log.createdAt,
      });
      inserted++;
    }

    return { success: true, workspaceId, logsInserted: inserted };
  },
});
