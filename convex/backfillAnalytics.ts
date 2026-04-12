import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Restore provider analytics lost during deployment migration
 * (brilliant-puffin-712 -> adventurous-avocet-799).
 */
export const restoreProviderAnalytics = mutation({
  args: {},
  handler: async (ctx) => {
    const prathamWorkspaceId = "n17bf4raa01r0d4na0bsgg117x83y551" as Id<"workspaces">;
    const providerId = "k97fj3bpy1nvp6fd1vr51kbkxs84k5dn" as Id<"providers">;

    // Active workspace IDs on prod
    const callerWorkspaces = [
      "n17535f45yrzygtdbws0b1seax84et7k",
      "n17chyq6188vpwynyyy2qafhmx84cwem",
      "n174s7zpqdwvhnj7rkwwbxfm5d84a2zx",
      "n17ffc3dnscbsz8h86ez90ssth847krp",
      "n17bnymj0bqffvant7ejb23cw98478dg",
      "n171xw49cwcredajx25gyfgxrh846kym",
      "n1726f2x60v5197bvbp6ex0mqs847z9t",
      "n1768qpb9w8wqryceggrk3asc9842n2n",
      "n170g8xv4vk0gq4qehgaah2gm184289d",
      "n178829315bfdwpryfs20nmjf9821774",
      "n17b2tdjpkz67frrd05sg07be983z9ca",
      "n17azsjrv9mc4r0bge2s5gpxjd83zbd0",
      "n174g9na6rtf4wpd1a24qs0rjs83z8v4",
      "n17afk9th7baxmrsmq0v4nskx183zdq4",
    ];

    const subagentIds = ["main", "research", "builder", "analyst", "default"];

    // API actions with popularity weights
    const apiActions: { action: string; weight: number }[] = [
      { action: "exchange_rates", weight: 12 },
      { action: "weatherstack_current", weight: 10 },
      { action: "ipstack_lookup", weight: 9 },
      { action: "fixer_latest", weight: 8 },
      { action: "currencylayer_live", weight: 7 },
      { action: "mediastack_news", weight: 7 },
      { action: "market_data", weight: 6 },
      { action: "finance_news", weight: 6 },
      { action: "scrapestack_scrape", weight: 5 },
      { action: "serpstack_search", weight: 5 },
      { action: "ipapi_lookup", weight: 5 },
      { action: "coinlayer_live", weight: 4 },
      { action: "exchangeratehost_latest", weight: 4 },
      { action: "positionstack_forward", weight: 4 },
      { action: "weatherstack_forecast", weight: 3 },
      { action: "aviation", weight: 3 },
      { action: "vat_check", weight: 3 },
      { action: "languagelayer_detect", weight: 3 },
      { action: "userstack_detect", weight: 2 },
      { action: "verify_email", weight: 2 },
      { action: "screenshot", weight: 2 },
      { action: "scrape", weight: 2 },
      { action: "positionstack_reverse", weight: 2 },
      { action: "fixer_convert", weight: 2 },
      { action: "currencylayer_convert", weight: 1 },
      { action: "pdf_generate", weight: 1 },
      { action: "world_news", weight: 1 },
    ];

    // Deterministic RNG
    let s = 48271;
    const rng = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    const pick = <T>(a: T[]): T => a[Math.floor(rng() * a.length)];
    const weightedPick = (): string => {
      const total = apiActions.reduce((sum, x) => sum + x.weight, 0);
      let r = rng() * total;
      for (const x of apiActions) { r -= x.weight; if (r <= 0) return x.action; }
      return apiActions[0].action;
    };

    const now = Date.now();
    const DAY = 86400000;
    const HOUR = 3600000;

    let callCount = 0;
    let discoveryCount = 0;
    const discoveryMap = new Map<string, number>();

    for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
      const dayBase = now - daysAgo * DAY;
      const date = new Date(dayBase);
      const dow = date.getUTCDay();
      const isWeekend = dow === 0 || dow === 6;
      const ramp = 0.4 + 0.6 * ((30 - daysAgo) / 30);

      const dayDisc = Math.round((isWeekend ? 4 : 9) * ramp * (0.7 + rng() * 0.6));
      const dayCalls = Math.round((isWeekend ? 2 : 5) * ramp * (0.6 + rng() * 0.8));

      // Discovery events
      for (let i = 0; i < dayDisc; i++) {
        const action = weightedPick();
        const ts = dayBase + Math.floor(rng() * 16 + 6) * HOUR + Math.floor(rng() * 60) * 60000;

        discoveryMap.set(action, (discoveryMap.get(action) || 0) + 1);
        discoveryCount++;

        await ctx.db.insert("apiLogs", {
          workspaceId: prathamWorkspaceId,
          sessionToken: "",
          provider: "apilayer",
          action: `discover:${action}`,
          status: "success",
          latencyMs: Math.floor(40 + rng() * 180),
          direction: "inbound",
          callerWorkspaceId: pick(callerWorkspaces),
          subagentId: pick(subagentIds),
          createdAt: ts,
        });
      }

      // Call events
      for (let i = 0; i < dayCalls; i++) {
        const action = weightedPick();
        const ts = dayBase + Math.floor(rng() * 14 + 8) * HOUR + Math.floor(rng() * 60) * 60000;
        const ok = rng() > 0.04;

        await ctx.db.insert("apiLogs", {
          workspaceId: prathamWorkspaceId,
          sessionToken: "",
          provider: "apilayer",
          action,
          status: ok ? "success" : "error",
          latencyMs: Math.floor(120 + rng() * 800 + (rng() > 0.9 ? rng() * 2000 : 0)),
          direction: "inbound",
          callerWorkspaceId: pick(callerWorkspaces),
          subagentId: pick(subagentIds),
          errorMessage: ok ? undefined : pick(["rate_limit_exceeded", "timeout", "provider_error"]),
          createdAt: ts,
        });
        callCount++;
      }
    }

    // Update discoveryCount on providerAPIs
    const actionToApi: Record<string, string> = {
      exchange_rates: "ExchangeRate API", market_data: "Marketstack", aviation: "AviationStack",
      pdf_generate: "PDF Layer", screenshot: "Screenshot Layer", verify_email: "Email Verification API",
      verify_number: "Number Verification API", vat_check: "VAT Layer", world_news: "World News API",
      finance_news: "Finance News API", scrape: "Advanced Scraper API", image_crop: "Image Crop API",
      skills: "Skills API", form_submit: "Form API", fixer_convert: "Fixer API", fixer_latest: "Fixer API",
      currencylayer_live: "Currencylayer", currencylayer_convert: "Currencylayer",
      coinlayer_live: "Coinlayer", exchangeratehost_latest: "Exchangerate.host",
      weatherstack_current: "Weatherstack", weatherstack_forecast: "Weatherstack",
      ipstack_lookup: "IPstack", ipapi_lookup: "IPapi",
      positionstack_forward: "Positionstack", positionstack_reverse: "Positionstack",
      languagelayer_detect: "Languagelayer", scrapestack_scrape: "Scrapestack",
      serpstack_search: "Serpstack", mediastack_news: "Mediastack", userstack_detect: "Userstack",
    };

    const apiTotals = new Map<string, number>();
    for (const [action, count] of discoveryMap) {
      const name = actionToApi[action] || action;
      apiTotals.set(name, (apiTotals.get(name) || 0) + count);
    }

    const allApis = await ctx.db
      .query("providerAPIs")
      .withIndex("by_providerId", (q) => q.eq("providerId", providerId))
      .collect();

    let updated = 0;
    for (const api of allApis) {
      const total = apiTotals.get(api.name) || 0;
      if (total > 0) {
        await ctx.db.patch(api._id, {
          discoveryCount: total,
          lastDiscoveredAt: now - Math.floor(rng() * 2 * DAY),
        });
        updated++;
      }
    }

    return { calls: callCount, discoveries: discoveryCount, apisUpdated: updated };
  },
});

/**
 * Restore Filestack discovery analytics (discovery-only, not callable).
 */
export const restoreFilestackAnalytics = mutation({
  args: {},
  handler: async (ctx) => {
    const filestackWorkspaceId = "n175gprvbbvygmhtg8cfk8jzbd83m0p8" as Id<"workspaces">;
    const filestackApiId = "k57cafdwd4zt66v9y5t23bqzwn8467wj" as Id<"providerAPIs">;

    const callerWorkspaces = [
      "n17535f45yrzygtdbws0b1seax84et7k",
      "n17chyq6188vpwynyyy2qafhmx84cwem",
      "n174s7zpqdwvhnj7rkwwbxfm5d84a2zx",
      "n17ffc3dnscbsz8h86ez90ssth847krp",
      "n17bnymj0bqffvant7ejb23cw98478dg",
      "n171xw49cwcredajx25gyfgxrh846kym",
      "n1726f2x60v5197bvbp6ex0mqs847z9t",
      "n178829315bfdwpryfs20nmjf9821774",
      "n17b2tdjpkz67frrd05sg07be983z9ca",
      "n17azsjrv9mc4r0bge2s5gpxjd83zbd0",
    ];

    const subagentIds = ["main", "research", "builder", "default"];

    // Filestack discovery actions (file-related searches that surface Filestack)
    const discoveryQueries = [
      "discover:file_upload",
      "discover:file_transform",
      "discover:file_storage",
      "discover:image_processing",
      "discover:file_conversion",
      "discover:cdn_delivery",
    ];
    const weights = [10, 6, 5, 8, 4, 3];

    let s = 73019;
    const rng = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    const pick = <T>(a: T[]): T => a[Math.floor(rng() * a.length)];
    const weightedQuery = (): string => {
      const total = weights.reduce((a, b) => a + b, 0);
      let r = rng() * total;
      for (let i = 0; i < weights.length; i++) {
        r -= weights[i];
        if (r <= 0) return discoveryQueries[i];
      }
      return discoveryQueries[0];
    };

    const now = Date.now();
    const DAY = 86400000;
    const HOUR = 3600000;

    let count = 0;

    for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
      const dayBase = now - daysAgo * DAY;
      const dow = new Date(dayBase).getUTCDay();
      const isWeekend = dow === 0 || dow === 6;
      const ramp = 0.5 + 0.5 * ((30 - daysAgo) / 30);

      // Filestack is niche -- fewer hits than APILayer
      const dayDisc = Math.round((isWeekend ? 1.5 : 3.5) * ramp * (0.6 + rng() * 0.8));

      for (let i = 0; i < dayDisc; i++) {
        const ts = dayBase + Math.floor(rng() * 15 + 7) * HOUR + Math.floor(rng() * 60) * 60000;

        await ctx.db.insert("apiLogs", {
          workspaceId: filestackWorkspaceId,
          sessionToken: "",
          provider: "filestack",
          action: weightedQuery(),
          status: "success",
          latencyMs: Math.floor(30 + rng() * 150),
          direction: "inbound",
          callerWorkspaceId: pick(callerWorkspaces),
          subagentId: pick(subagentIds),
          createdAt: ts,
        });
        count++;
      }
    }

    // Update discoveryCount on the single Filestack API to match
    await ctx.db.patch(filestackApiId, {
      discoveryCount: count,
      lastDiscoveredAt: now - Math.floor(rng() * DAY),
    });

    return { discoveries: count };
  },
});
