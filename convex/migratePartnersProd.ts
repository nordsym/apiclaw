import { mutation } from "./_generated/server";

/**
 * Seed both partner providers (Filestack + APILayer) in PROD with:
 * - Provider record
 * - All providerAPIs
 * Run on prod: npx convex run migratePartnersProd:run --prod
 */
export const run = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const results: Record<string, unknown> = {};

    // =====================================================================
    // 1. FILESTACK PROVIDER
    // =====================================================================
    let filestackProvider = await ctx.db
      .query("providers")
      .withIndex("by_email", (q) => q.eq("email", "marketing@filestack.com"))
      .first();

    if (!filestackProvider) {
      const id = await ctx.db.insert("providers", {
        email: "marketing@filestack.com",
        name: "Filestack",
        company: "Filestack",
        website: "https://filestack.com",
        status: "approved",
        stripeOnboardingComplete: false,
        createdAt: now,
        updatedAt: now,
        approvedAt: now,
      });
      filestackProvider = await ctx.db.get(id);
    }
    if (!filestackProvider) throw new Error("Filestack provider creation failed");

    const filestackAPIs = [
      { name: "File Upload API", description: "Reliable file upload from browser, mobile, or server", category: "storage" },
      { name: "Image Transformation API", description: "Resize, crop, convert, and process images on the fly", category: "storage" },
      { name: "CDN Delivery", description: "Deliver files globally via fast CDN", category: "storage" },
      { name: "File Storage Cloud", description: "Scalable cloud storage for any file type", category: "storage" },
      { name: "File Picker Widget", description: "Embeddable file picker UI for web apps", category: "storage" },
      { name: "Document Upload Processing", description: "Process documents (PDF, Word, Excel) on upload", category: "storage" },
      { name: "Virus Scan", description: "Scan uploaded files for malware and viruses in real-time", category: "security" },
      { name: "OCR Document Scan", description: "Extract text from scanned documents and images", category: "storage" },
      { name: "PDF to Image Convert", description: "Convert PDF pages to high-quality images", category: "storage" },
      { name: "File Management API", description: "List, move, copy, delete files programmatically", category: "storage" },
    ];

    let fsCreated = 0;
    for (const api of filestackAPIs) {
      const exists = await ctx.db
        .query("providerAPIs")
        .withIndex("by_providerId", (q) => q.eq("providerId", filestackProvider!._id))
        .filter((q) => q.eq(q.field("name"), api.name))
        .first();
      if (!exists) {
        await ctx.db.insert("providerAPIs", {
          providerId: filestackProvider._id,
          name: api.name,
          description: api.description,
          category: api.category,
          pricingModel: "freemium",
          pricingNotes: "Free tier available",
          status: "approved",
          createdAt: now,
          approvedAt: now,
          discoveryCount: 0,
        });
        fsCreated++;
      }
    }

    results.filestack = {
      providerId: filestackProvider._id,
      apisCreated: fsCreated,
      apisTotal: filestackAPIs.length,
    };

    // =====================================================================
    // 2. APILAYER PROVIDER (Pratham)
    // =====================================================================
    let apiLayerProvider = await ctx.db
      .query("providers")
      .withIndex("by_email", (q) => q.eq("email", "pratham.kumar@apilayer.com"))
      .first();

    if (!apiLayerProvider) {
      const id = await ctx.db.insert("providers", {
        email: "pratham.kumar@apilayer.com",
        name: "APILayer",
        company: "APILayer",
        website: "https://apilayer.com",
        status: "approved",
        stripeOnboardingComplete: false,
        createdAt: now,
        updatedAt: now,
        approvedAt: now,
      });
      apiLayerProvider = await ctx.db.get(id);
    }
    if (!apiLayerProvider) throw new Error("APILayer provider creation failed");

    const apiLayerAPIs = [
      // Finance
      { name: "ExchangeRate API", description: "Real-time exchange rates and currency conversion", category: "finance" },
      { name: "Fixer API", description: "Foreign exchange rates & currency conversion", category: "finance" },
      { name: "Currencylayer", description: "Reliable exchange rates for your business", category: "finance" },
      { name: "Coinlayer", description: "Real-time crypto currency exchange rates", category: "finance" },
      { name: "Exchangerate.host", description: "Free exchange rates API", category: "finance" },
      { name: "VAT Layer", description: "EU VAT number validation", category: "finance" },
      { name: "Marketstack", description: "Real-time, intraday & historical market data", category: "finance" },
      // Geolocation
      { name: "AviationStack", description: "Real-time flight status & global aviation data", category: "geolocation" },
      { name: "Weatherstack", description: "Real-time & historical weather data", category: "geolocation" },
      { name: "IPstack", description: "Locate and identify website visitors by IP", category: "geolocation" },
      { name: "IPapi", description: "IP address geolocation lookup", category: "geolocation" },
      { name: "Positionstack", description: "Forward & reverse geocoding", category: "geolocation" },
      // News
      { name: "Mediastack", description: "Live news & blog articles", category: "news" },
      { name: "Finance News API", description: "Real-time financial news feed", category: "news" },
      { name: "World News API", description: "Extract news from any URL", category: "news" },
      // DevTools
      { name: "Email Verification API", description: "Verify email addresses in real-time", category: "devtools" },
      { name: "Number Verification API", description: "Validate phone numbers globally", category: "devtools" },
      { name: "Languagelayer", description: "Powerful language detection", category: "devtools" },
      { name: "Userstack", description: "Detect any browser, device & OS", category: "devtools" },
      { name: "Skills API", description: "Search skill database", category: "devtools" },
      { name: "Form API", description: "Form submission handling", category: "devtools" },
      // Scraping
      { name: "Scrapestack", description: "Real-time web scraping", category: "scraping" },
      { name: "Serpstack", description: "Google search results API", category: "scraping" },
      { name: "Advanced Scraper API", description: "Web scraping without the hassle", category: "scraping" },
      // Marketing/Business
      { name: "Screenshot Layer", description: "Capture website screenshots", category: "marketing" },
      { name: "Image Crop API", description: "Smart image cropping", category: "marketing" },
      { name: "PDF Layer", description: "High quality HTML to PDF conversion", category: "business" },
    ];

    let alCreated = 0;
    for (const api of apiLayerAPIs) {
      const exists = await ctx.db
        .query("providerAPIs")
        .withIndex("by_providerId", (q) => q.eq("providerId", apiLayerProvider!._id))
        .filter((q) => q.eq(q.field("name"), api.name))
        .first();
      if (!exists) {
        await ctx.db.insert("providerAPIs", {
          providerId: apiLayerProvider._id,
          name: api.name,
          description: api.description,
          category: api.category,
          pricingModel: "freemium",
          pricingNotes: "Free tier available, paid tiers for higher limits",
          status: "approved",
          createdAt: now,
          approvedAt: now,
          discoveryCount: 0,
        });
        alCreated++;
      }
    }

    results.apilayer = {
      providerId: apiLayerProvider._id,
      apisCreated: alCreated,
      apisTotal: apiLayerAPIs.length,
    };

    return { success: true, ...results };
  },
});
