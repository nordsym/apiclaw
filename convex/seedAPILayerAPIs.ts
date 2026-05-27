import { mutation } from "./_generated/server";

/**
 * Seed all 27 APILayer APIs for a workspace
 * Run with: npx convex run seedAPILayerAPIs:seedAll '{"email":"gustav_hemmingsson@hotmail.com"}'
 */

// Subscription-gated APIs from APILayer side (HTTP 403 "You cannot consume this service").
// Confirmed by live test against the unified APILAYER_API_KEY on 2026-05-18.
// Image Crop and Skills were previously here but verified callable (200 OK) — moved to approved.
const APILAYER_BLOCKED_NAMES = new Set([
  "Number Verification API",
  "World News API",
  "Form API",
]);
const APILAYER_RATE_LIMITED_NAMES = new Set(["PDF Layer"]);

function statusForApiName(name: string): "approved" | "blocked" | "rate_limited" {
  if (APILAYER_BLOCKED_NAMES.has(name)) return "blocked";
  if (APILAYER_RATE_LIMITED_NAMES.has(name)) return "rate_limited";
  return "approved";
}

export const cleanAndReseed = mutation({
  args: {},
  handler: async (ctx) => {
    const email = "gustav_hemmingsson@hotmail.com";
    
    // Find provider
    const provider = await ctx.db
      .query("providers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    
    if (!provider) return { success: false, error: "Provider not found" };
    
    // Delete ALL existing providerAPIs for this provider
    const existing = await ctx.db
      .query("providerAPIs")
      .withIndex("by_providerId", (q) => q.eq("providerId", provider._id))
      .collect();
    
    for (const api of existing) {
      await ctx.db.delete(api._id);
    }
    
    // Re-insert canonical 27
    const canonical = [
      { name: "ExchangeRate API", description: "Real-time exchange rates and currency conversion", category: "finance" },
      { name: "Marketstack", description: "Real-time, intraday & historical market data", category: "finance" },
      { name: "AviationStack", description: "Real-time flight status & global aviation data", category: "geolocation" },
      { name: "PDF Layer", description: "High quality HTML to PDF conversion", category: "business" },
      { name: "Screenshot Layer", description: "Capture website screenshots", category: "marketing" },
      { name: "Email Verification API", description: "Verify email addresses in real-time", category: "devtools" },
      { name: "Number Verification API", description: "Validate phone numbers globally", category: "devtools" },
      { name: "VAT Layer", description: "EU VAT number validation", category: "finance" },
      { name: "World News API", description: "Extract news from any URL", category: "news" },
      { name: "Finance News API", description: "Real-time financial news feed", category: "news" },
      { name: "Advanced Scraper API", description: "Web scraping without the hassle", category: "scraping" },
      { name: "Image Crop API", description: "Smart image cropping", category: "marketing" },
      { name: "Skills API", description: "Search skill database", category: "devtools" },
      { name: "Form API", description: "Form submission handling", category: "devtools" },
      { name: "Fixer API", description: "Foreign exchange rates & currency conversion", category: "finance" },
      { name: "Currencylayer", description: "Reliable exchange rates for your business", category: "finance" },
      { name: "Coinlayer", description: "Real-time crypto currency exchange rates", category: "finance" },
      { name: "Exchangerate.host", description: "Free exchange rates API", category: "finance" },
      { name: "Weatherstack", description: "Real-time & historical weather data", category: "geolocation" },
      { name: "IPstack", description: "Locate and identify website visitors by IP", category: "geolocation" },
      { name: "IPapi", description: "IP address geolocation lookup", category: "geolocation" },
      { name: "Positionstack", description: "Forward & reverse geocoding", category: "geolocation" },
      { name: "Languagelayer", description: "Powerful language detection", category: "devtools" },
      { name: "Scrapestack", description: "Real-time web scraping", category: "scraping" },
      { name: "Serpstack", description: "Google search results API", category: "scraping" },
      { name: "Mediastack", description: "Live news & blog articles", category: "news" },
      { name: "Userstack", description: "Detect any browser, device & OS", category: "devtools" },
    ];
    
    for (const api of canonical) {
      await ctx.db.insert("providerAPIs", {
        providerId: provider._id,
        name: api.name,
        description: api.description,
        category: api.category,
        pricingModel: "freemium",
        pricingNotes: "Free tier available, paid tiers for higher limits",
        status: statusForApiName(api.name),
        createdAt: Date.now(),
        approvedAt: Date.now(),
        discoveryCount: 0,
      });
    }
    
    return { success: true, deleted: existing.length, created: canonical.length };
  },
});

export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    const email = "gustav_hemmingsson@hotmail.com";
    
    // 1. Create or get provider
    let provider = await ctx.db
      .query("providers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    
    if (!provider) {
      const providerId = await ctx.db.insert("providers", {
        email,
        name: "APILayer",
        company: "APILayer",
        website: "https://apilayer.com",
        status: "approved",
        stripeOnboardingComplete: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        approvedAt: Date.now(),
      });
      provider = await ctx.db.get(providerId);
      console.log("✓ Provider created");
    } else {
      console.log("✓ Provider exists:", provider.name);
    }
    
    if (!provider) throw new Error("Provider creation failed");
    
    // 2. Add all 27 APIs
    const apis = [
      // Unified APIs (14)
      { name: "ExchangeRate API", description: "Real-time exchange rates and currency conversion", category: "finance" },
      { name: "Marketstack", description: "Real-time, intraday & historical market data", category: "finance" },
      { name: "AviationStack", description: "Real-time flight status & global aviation data", category: "geolocation" },
      { name: "PDF Layer", description: "High quality HTML to PDF conversion", category: "business" },
      { name: "Screenshot Layer", description: "Capture website screenshots", category: "marketing" },
      { name: "Email Verification API", description: "Verify email addresses in real-time", category: "devtools" },
      { name: "Number Verification API", description: "Validate phone numbers globally", category: "devtools" },
      { name: "VAT Layer", description: "EU VAT number validation", category: "finance" },
      { name: "World News API", description: "Extract news from any URL", category: "news" },
      { name: "Finance News API", description: "Real-time financial news feed", category: "news" },
      { name: "Advanced Scraper API", description: "Web scraping without the hassle", category: "scraping" },
      { name: "Image Crop API", description: "Smart image cropping", category: "marketing" },
      { name: "Skills API", description: "Search skill database", category: "devtools" },
      { name: "Form API", description: "Form submission handling", category: "devtools" },
      
      // Legacy APIs (13)
      { name: "Fixer API", description: "Foreign exchange rates & currency conversion", category: "finance" },
      { name: "Currencylayer", description: "Reliable exchange rates for your business", category: "finance" },
      { name: "Coinlayer", description: "Real-time crypto currency exchange rates", category: "finance" },
      { name: "Exchangerate.host", description: "Free exchange rates API", category: "finance" },
      { name: "Weatherstack", description: "Real-time & historical weather data", category: "geolocation" },
      { name: "IPstack", description: "Locate and identify website visitors by IP", category: "geolocation" },
      { name: "IPapi", description: "IP address geolocation lookup", category: "geolocation" },
      { name: "Positionstack", description: "Forward & reverse geocoding", category: "geolocation" },
      { name: "Languagelayer", description: "Powerful language detection", category: "devtools" },
      { name: "Scrapestack", description: "Real-time web scraping", category: "scraping" },
      { name: "Serpstack", description: "Google search results API", category: "scraping" },
      { name: "Mediastack", description: "Live news & blog articles", category: "news" },
      { name: "Userstack", description: "Detect any browser, device & OS", category: "devtools" },
    ];
    
    let created = 0;
    let skipped = 0;
    
    for (const api of apis) {
      // Check if exists
      const existing = await ctx.db
        .query("providerAPIs")
        .withIndex("by_providerId", (q) => q.eq("providerId", provider!._id))
        .filter((q) => q.eq(q.field("name"), api.name))
        .first();
      
      if (!existing) {
        await ctx.db.insert("providerAPIs", {
          providerId: provider._id,
          name: api.name,
          description: api.description,
          category: api.category,
          pricingModel: "freemium",
          pricingNotes: "Free tier available, paid tiers for higher limits",
          status: statusForApiName(api.name),
          createdAt: Date.now(),
          approvedAt: Date.now(),
          discoveryCount: 0,
        });
        console.log(`✓ ${api.name}`);
        created++;
      } else {
        skipped++;
      }
    }
    
    return {
      success: true,
      provider: {
        email: provider.email,
        name: provider.name,
        id: provider._id,
      },
      apis: {
        total: apis.length,
        created,
        skipped,
      },
    };
  },
});
