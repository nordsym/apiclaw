import { mutation } from "./_generated/server";

/**
 * Seed Pratham's workspace with all 27 APILayer APIs
 * Run with: npx convex run seedPratham:seedPrathamWorkspace
 */

export const seedPrathamWorkspace = mutation({
  args: {},
  handler: async (ctx) => {
    const email = "pratham@apilayer.com";

    // 1. Get existing workspace (already created + activated on prod)
    let workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!workspace) {
      throw new Error(`Workspace for ${email} not found on prod. Create it first.`);
    }

    console.log(`✓ Workspace exists: ${workspace._id} (${workspace.tier}, ${workspace.status})`);
    
    // 2. Create provider profile linked to workspace
    let provider = await ctx.db
      .query("providers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!provider) {
      const providerId = await ctx.db.insert("providers", {
        email,
        name: "Pratham (APILayer)",
        company: "APILayer",
        website: "https://apilayer.com",
        status: "approved",
        workspaceId: workspace._id,
        stripeOnboardingComplete: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        approvedAt: Date.now(),
      });

      provider = await ctx.db.get(providerId);
      console.log(`✓ Created provider profile linked to workspace ${workspace._id}`);
    } else {
      // Ensure workspaceId is linked
      if (!provider.workspaceId) {
        await ctx.db.patch(provider._id, { workspaceId: workspace._id });
        console.log(`✓ Linked existing provider to workspace ${workspace._id}`);
      }
      console.log(`✓ Provider profile exists: ${provider._id}`);
    }

    if (!provider) throw new Error("Failed to create provider");
    
    // 3. Create all 27 APILayer APIs
    const apis = [
      // Unified APIs (14)
      { name: "ExchangeRate API", description: "Real-time exchange rates", category: "finance", action: "exchange_rates" },
      { name: "Marketstack", description: "Real-time market data", category: "finance", action: "market_data" },
      { name: "AviationStack", description: "Flight data API", category: "geolocation", action: "aviation" },
      { name: "PDF Layer", description: "HTML to PDF conversion", category: "business", action: "pdf_generate" },
      { name: "Screenshot Layer", description: "Website screenshots", category: "marketing", action: "screenshot" },
      { name: "Email Verification API", description: "Verify email addresses", category: "devtools", action: "verify_email" },
      { name: "Number Verification API", description: "Validate phone numbers", category: "devtools", action: "verify_number" },
      { name: "VAT Layer", description: "VAT number validation", category: "finance", action: "vat_check" },
      { name: "World News API", description: "Extract news from URLs", category: "news", action: "world_news" },
      { name: "Finance News API", description: "Financial news feed", category: "news", action: "finance_news" },
      { name: "Advanced Scraper API", description: "Web scraping", category: "scraping", action: "scrape" },
      { name: "Image Crop API", description: "Smart image cropping", category: "marketing", action: "image_crop" },
      { name: "Skills API", description: "Skill database search", category: "devtools", action: "skills" },
      { name: "Form API", description: "Form submission handling", category: "devtools", action: "form_submit" },
      
      // Legacy APIs (13)
      { name: "Fixer API", description: "Currency conversion (legacy)", category: "finance", action: "fixer_convert" },
      { name: "Fixer Latest Rates", description: "Latest exchange rates", category: "finance", action: "fixer_latest" },
      { name: "Currencylayer Live", description: "Live currency rates", category: "finance", action: "currencylayer_live" },
      { name: "Currencylayer Convert", description: "Currency conversion", category: "finance", action: "currencylayer_convert" },
      { name: "Coinlayer", description: "Crypto exchange rates", category: "finance", action: "coinlayer_live" },
      { name: "Exchangerate.host", description: "Exchange rates API", category: "finance", action: "exchangeratehost_latest" },
      { name: "Weatherstack Current", description: "Current weather data", category: "geolocation", action: "weatherstack_current" },
      { name: "Weatherstack Forecast", description: "Weather forecasts", category: "geolocation", action: "weatherstack_forecast" },
      { name: "IPstack", description: "IP geolocation lookup", category: "geolocation", action: "ipstack_lookup" },
      { name: "IPapi", description: "IP address lookup", category: "geolocation", action: "ipapi_lookup" },
      { name: "Positionstack Forward", description: "Geocoding (address → coords)", category: "geolocation", action: "positionstack_forward" },
      { name: "Positionstack Reverse", description: "Reverse geocoding (coords → address)", category: "geolocation", action: "positionstack_reverse" },
      { name: "Languagelayer", description: "Language detection", category: "devtools", action: "languagelayer_detect" },
      { name: "Scrapestack", description: "Web scraping service", category: "scraping", action: "scrapestack_scrape" },
      { name: "Serpstack", description: "Google search results", category: "scraping", action: "serpstack_search" },
      { name: "Mediastack", description: "News and blog articles", category: "news", action: "mediastack_news" },
      { name: "Userstack", description: "User agent detection", category: "devtools", action: "userstack_detect" },
    ];
    
    let createdCount = 0;
    let existingCount = 0;
    
    for (const api of apis) {
      // Check if already exists
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
          status: "approved",
          createdAt: Date.now(),
          approvedAt: Date.now(),
          discoveryCount: 0,
        });
        createdCount++;
      } else {
        existingCount++;
      }
    }
    
    console.log(`✓ APIs: ${createdCount} created, ${existingCount} already existed`);
    
    return {
      success: true,
      workspace: {
        email: workspace.email,
        tier: workspace.tier,
        id: workspace._id,
      },
      provider: {
        name: provider.name,
        company: provider.company,
        id: provider._id,
      },
      apis: {
        total: apis.length,
        created: createdCount,
        existing: existingCount,
      },
      dashboardUrl: `https://apiclaw.cloud/workspace`,
      loginInstructions: "Magic link sent to pratham@apilayer.com",
    };
  },
});
