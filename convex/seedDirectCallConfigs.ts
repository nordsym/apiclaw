import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Seed Direct Call configs + actions for all 27 APILayer APIs
 * Sets status: "live" and creates action records matching MCP proxy
 *
 * Run: npx convex run seedDirectCallConfigs:seed
 */

const API_CONFIGS: Record<string, {
  baseUrl: string;
  actions: { name: string; displayName: string; description: string; method: string; path: string; params: { name: string; type: string; required: boolean; description: string; in: string }[] }[];
}> = {
  "ExchangeRate API": {
    baseUrl: "https://api.apilayer.com/exchangerates_data",
    actions: [
      { name: "exchange_rates", displayName: "Get Exchange Rates", description: "Get latest exchange rates", method: "GET", path: "/latest", params: [
        { name: "base", type: "string", required: false, description: "Base currency (default: EUR)", in: "query" },
        { name: "symbols", type: "string", required: false, description: "Comma-separated target currencies", in: "query" },
      ]},
    ],
  },
  "Marketstack": {
    baseUrl: "http://api.marketstack.com/v1",
    actions: [
      { name: "market_data", displayName: "End of Day Data", description: "Get end-of-day stock market data", method: "GET", path: "/eod", params: [
        { name: "symbols", type: "string", required: true, description: "Stock ticker symbol(s)", in: "query" },
      ]},
    ],
  },
  "AviationStack": {
    baseUrl: "http://api.aviationstack.com/v1",
    actions: [
      { name: "aviation", displayName: "Flight Status", description: "Get real-time flight status", method: "GET", path: "/flights", params: [
        { name: "flight_iata", type: "string", required: false, description: "Flight IATA code", in: "query" },
        { name: "dep_iata", type: "string", required: false, description: "Departure airport IATA", in: "query" },
      ]},
    ],
  },
  "PDF Layer": {
    baseUrl: "https://api.pdflayer.com/api",
    actions: [
      { name: "pdf_generate", displayName: "Generate PDF", description: "Convert HTML/URL to PDF", method: "POST", path: "/convert", params: [
        { name: "document_url", type: "string", required: false, description: "URL to convert", in: "query" },
        { name: "document_html", type: "string", required: false, description: "HTML to convert", in: "body" },
      ]},
    ],
  },
  "Screenshot Layer": {
    baseUrl: "https://api.apilayer.com/screenshot",
    actions: [
      { name: "screenshot", displayName: "Capture Screenshot", description: "Capture website screenshot", method: "GET", path: "/capture", params: [
        { name: "url", type: "string", required: true, description: "URL to screenshot", in: "query" },
      ]},
    ],
  },
  "Email Verification API": {
    baseUrl: "https://api.apilayer.com/email_verification",
    actions: [
      { name: "verify_email", displayName: "Verify Email", description: "Verify email address validity", method: "GET", path: "/check", params: [
        { name: "email", type: "string", required: true, description: "Email to verify", in: "query" },
      ]},
    ],
  },
  "Number Verification API": {
    baseUrl: "https://api.apilayer.com/number_verification",
    actions: [
      { name: "verify_number", displayName: "Verify Number", description: "Validate phone number", method: "GET", path: "/validate", params: [
        { name: "number", type: "string", required: true, description: "Phone number to validate", in: "query" },
      ]},
    ],
  },
  "VAT Layer": {
    baseUrl: "https://api.apilayer.com/vat_layer",
    actions: [
      { name: "vat_check", displayName: "Validate VAT", description: "Validate EU VAT number", method: "GET", path: "/validate", params: [
        { name: "vat_number", type: "string", required: true, description: "VAT number to validate", in: "query" },
      ]},
    ],
  },
  "World News API": {
    baseUrl: "https://api.apilayer.com/world_news",
    actions: [
      { name: "world_news", displayName: "Extract News", description: "Extract news from URL", method: "GET", path: "/extract-news", params: [
        { name: "url", type: "string", required: true, description: "News URL to extract", in: "query" },
      ]},
    ],
  },
  "Finance News API": {
    baseUrl: "https://api.apilayer.com/financelayer",
    actions: [
      { name: "finance_news", displayName: "Financial News", description: "Get financial news feed", method: "GET", path: "/news", params: [
        { name: "tickers", type: "string", required: false, description: "Stock tickers to filter", in: "query" },
      ]},
    ],
  },
  "Advanced Scraper API": {
    baseUrl: "https://api.apilayer.com/adv_scraper",
    actions: [
      { name: "scrape", displayName: "Scrape URL", description: "Scrape web page content", method: "GET", path: "/scraper", params: [
        { name: "url", type: "string", required: true, description: "URL to scrape", in: "query" },
      ]},
    ],
  },
  "Image Crop API": {
    baseUrl: "https://api.apilayer.com/smart_crop",
    actions: [
      { name: "image_crop", displayName: "Smart Crop", description: "AI-powered image cropping", method: "POST", path: "/url", params: [
        { name: "url", type: "string", required: true, description: "Image URL to crop", in: "query" },
      ]},
    ],
  },
  "Skills API": {
    baseUrl: "https://api.apilayer.com/skills",
    actions: [
      { name: "skills", displayName: "Search Skills", description: "Search skill database", method: "GET", path: "/", params: [
        { name: "q", type: "string", required: true, description: "Search query", in: "query" },
      ]},
    ],
  },
  "Form API": {
    baseUrl: "https://api.apilayer.com/form_api",
    actions: [
      { name: "form_submit", displayName: "Submit Form", description: "Form submission handling", method: "POST", path: "/submit", params: [
        { name: "endpoint", type: "string", required: true, description: "Form endpoint", in: "path" },
      ]},
    ],
  },
  "Fixer API": {
    baseUrl: "http://data.fixer.io/api",
    actions: [
      { name: "fixer_convert", displayName: "Convert Currency", description: "Convert between currencies", method: "GET", path: "/convert", params: [
        { name: "from", type: "string", required: true, description: "Source currency", in: "query" },
        { name: "to", type: "string", required: true, description: "Target currency", in: "query" },
        { name: "amount", type: "number", required: true, description: "Amount to convert", in: "query" },
      ]},
      { name: "fixer_latest", displayName: "Latest Rates", description: "Get latest exchange rates", method: "GET", path: "/latest", params: [
        { name: "base", type: "string", required: false, description: "Base currency", in: "query" },
        { name: "symbols", type: "string", required: false, description: "Target currencies", in: "query" },
      ]},
    ],
  },
  "Currencylayer": {
    baseUrl: "http://api.currencylayer.com",
    actions: [
      { name: "currencylayer_live", displayName: "Live Rates", description: "Get live exchange rates", method: "GET", path: "/live", params: [
        { name: "currencies", type: "string", required: false, description: "Target currencies", in: "query" },
      ]},
      { name: "currencylayer_convert", displayName: "Convert", description: "Convert currency amount", method: "GET", path: "/convert", params: [
        { name: "from", type: "string", required: true, description: "Source currency", in: "query" },
        { name: "to", type: "string", required: true, description: "Target currency", in: "query" },
        { name: "amount", type: "number", required: true, description: "Amount", in: "query" },
      ]},
    ],
  },
  "Coinlayer": {
    baseUrl: "http://api.coinlayer.com",
    actions: [
      { name: "coinlayer_live", displayName: "Live Crypto Rates", description: "Get live cryptocurrency rates", method: "GET", path: "/live", params: [
        { name: "symbols", type: "string", required: false, description: "Crypto symbols", in: "query" },
      ]},
    ],
  },
  "Exchangerate.host": {
    baseUrl: "https://api.exchangerate.host",
    actions: [
      { name: "exchangeratehost_latest", displayName: "Latest Rates", description: "Free exchange rates", method: "GET", path: "/latest", params: [
        { name: "base", type: "string", required: false, description: "Base currency", in: "query" },
      ]},
    ],
  },
  "Weatherstack": {
    baseUrl: "http://api.weatherstack.com",
    actions: [
      { name: "weatherstack_current", displayName: "Current Weather", description: "Get current weather data", method: "GET", path: "/current", params: [
        { name: "query", type: "string", required: true, description: "Location (city, IP, coordinates)", in: "query" },
      ]},
      { name: "weatherstack_forecast", displayName: "Weather Forecast", description: "Get weather forecast", method: "GET", path: "/forecast", params: [
        { name: "query", type: "string", required: true, description: "Location", in: "query" },
        { name: "forecast_days", type: "number", required: false, description: "Days to forecast", in: "query" },
      ]},
    ],
  },
  "IPstack": {
    baseUrl: "http://api.ipstack.com",
    actions: [
      { name: "ipstack_lookup", displayName: "IP Lookup", description: "Geolocate IP address", method: "GET", path: "/{ip}", params: [
        { name: "ip", type: "string", required: true, description: "IP address to lookup", in: "path" },
      ]},
    ],
  },
  "IPapi": {
    baseUrl: "http://api.ipapi.com",
    actions: [
      { name: "ipapi_lookup", displayName: "IP Geolocation", description: "IP address geolocation", method: "GET", path: "/{ip}", params: [
        { name: "ip", type: "string", required: true, description: "IP address", in: "path" },
      ]},
    ],
  },
  "Positionstack": {
    baseUrl: "http://api.positionstack.com/v1",
    actions: [
      { name: "positionstack_forward", displayName: "Forward Geocode", description: "Address to coordinates", method: "GET", path: "/forward", params: [
        { name: "query", type: "string", required: true, description: "Address to geocode", in: "query" },
      ]},
      { name: "positionstack_reverse", displayName: "Reverse Geocode", description: "Coordinates to address", method: "GET", path: "/reverse", params: [
        { name: "query", type: "string", required: true, description: "Lat,lng coordinates", in: "query" },
      ]},
    ],
  },
  "Languagelayer": {
    baseUrl: "https://api.languagelayer.com",
    actions: [
      { name: "languagelayer_detect", displayName: "Detect Language", description: "Detect text language", method: "POST", path: "/detect", params: [
        { name: "query", type: "string", required: true, description: "Text to analyze", in: "body" },
      ]},
    ],
  },
  "Scrapestack": {
    baseUrl: "http://api.scrapestack.com",
    actions: [
      { name: "scrapestack_scrape", displayName: "Scrape Page", description: "Web scraping proxy", method: "GET", path: "/scrape", params: [
        { name: "url", type: "string", required: true, description: "URL to scrape", in: "query" },
      ]},
    ],
  },
  "Serpstack": {
    baseUrl: "http://api.serpstack.com",
    actions: [
      { name: "serpstack_search", displayName: "Search Google", description: "Google search results", method: "GET", path: "/search", params: [
        { name: "query", type: "string", required: true, description: "Search query", in: "query" },
      ]},
    ],
  },
  "Mediastack": {
    baseUrl: "http://api.mediastack.com/v1",
    actions: [
      { name: "mediastack_news", displayName: "Get News", description: "Live news articles", method: "GET", path: "/news", params: [
        { name: "keywords", type: "string", required: false, description: "News keywords", in: "query" },
        { name: "countries", type: "string", required: false, description: "Country codes", in: "query" },
      ]},
    ],
  },
  "Userstack": {
    baseUrl: "http://api.userstack.com",
    actions: [
      { name: "userstack_detect", displayName: "Detect User Agent", description: "Parse user agent string", method: "GET", path: "/detect", params: [
        { name: "ua", type: "string", required: true, description: "User agent string", in: "query" },
      ]},
    ],
  },
};

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const providerId = "k97cvcvadnyz8x8m4we7xqmh1s83p0ph" as any; // APILayer provider ID
    const now = Date.now();

    // Get all provider APIs
    const apis = await ctx.db
      .query("providerAPIs")
      .withIndex("by_providerId", (q: any) => q.eq("providerId", providerId))
      .collect();

    let configsCreated = 0;
    let actionsCreated = 0;

    for (const api of apis) {
      const config = API_CONFIGS[api.name];
      if (!config) continue;

      // Check if Direct Call config already exists
      const existing = await ctx.db
        .query("providerDirectCall")
        .withIndex("by_apiId", (q: any) => q.eq("apiId", api._id))
        .first();

      let directCallId;
      if (existing) {
        // Update to live
        await ctx.db.patch(existing._id, { status: "live", updatedAt: now, publishedAt: now });
        directCallId = existing._id;
      } else {
        // Create new config
        directCallId = await ctx.db.insert("providerDirectCall", {
          providerId,
          apiId: api._id,
          baseUrl: config.baseUrl,
          authType: "bearer",
          authHeader: "apikey",
          authPrefix: "",
          encryptedMasterKey: "managed-by-apiclaw",
          rateLimitPerUser: 60,
          rateLimitPerDay: 1000,
          pricePerRequest: 0,
          status: "live",
          allowCustomerKeys: false,
          requireCustomerKeys: false,
          createdAt: now,
          updatedAt: now,
          publishedAt: now,
        });
        configsCreated++;
      }

      // Create actions (skip if already exist)
      for (const action of config.actions) {
        const existingAction = await ctx.db
          .query("providerActions")
          .withIndex("by_directCallId_name", (q: any) => q.eq("directCallId", directCallId).eq("name", action.name))
          .first();

        if (!existingAction) {
          await ctx.db.insert("providerActions", {
            directCallId,
            name: action.name,
            displayName: action.displayName,
            description: action.description,
            method: action.method,
            path: action.path,
            params: action.params,
            responseMapping: [],
            enabled: true,
            createdAt: now,
            updatedAt: now,
          });
          actionsCreated++;
        }
      }
    }

    return { success: true, configsCreated, actionsCreated, totalApis: apis.length };
  },
});
