#!/usr/bin/env node
/**
 * Add all 27 APILayer APIs to Gustav's workspace
 */

import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = "https://adventurous-avocet-799.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

const email = "gustav_hemmingsson@hotmail.com";

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

async function main() {
  console.log("🚀 Adding all 27 APILayer APIs to workspace...\n");
  
  // 1. Get or create provider
  console.log("1. Checking for provider...");
  let provider = await client.query("providers:getProviderByEmail", { email });
  
  if (!provider) {
    console.log("   Creating provider profile...");
    // Provider doesn't exist, we'll add APIs one by one with provider creation
  } else {
    console.log(`   ✓ Provider exists: ${provider.name}`);
  }
  
  // 2. Add all APIs
  let created = 0;
  let skipped = 0;
  
  for (const api of apis) {
    try {
      // Use the addAPI mutation that creates provider if needed
      const result = await client.mutation("providers:addAPI", {
        provider: {
          email,
          name: "APILayer",
          website: "https://apilayer.com",
        },
        api: {
          name: api.name,
          description: api.description,
          category: api.category,
          pricingModel: "freemium",
          pricingNotes: "Free tier available, paid tiers for higher limits",
        },
      });
      
      if (result.success) {
        console.log(`   ✓ ${api.name}`);
        created++;
      } else {
        console.log(`   ⚠ ${api.name} - ${result.error || 'already exists'}`);
        skipped++;
      }
    } catch (error) {
      console.log(`   ✗ ${api.name} - ${error.message}`);
      skipped++;
    }
  }
  
  console.log(`\n✅ Complete!`);
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${apis.length}`);
  console.log(`\nRefresh dashboard at: https://apiclaw.cloud/workspace`);
}

main().catch(console.error);
