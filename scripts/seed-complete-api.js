#!/usr/bin/env node
/**
 * Seed a complete API with Direct Call and usage data for APIClaw
 * Usage: node scripts/seed-complete-api.js
 */

const CONVEX_URL = "https://brilliant-puffin-712.eu-west-1.convex.cloud";

async function convexMutation(path, args) {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });
  return res.json();
}

async function convexQuery(path, args) {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });
  return res.json();
}

async function main() {
  console.log("🦞 Seeding complete API for APIClaw...\n");

  // Step 1: Create the API listing
  console.log("1. Creating API listing...");
  const apiResult = await convexMutation("providers:registerProvider", {
    provider: {
      name: "NordSym AB",
      email: "gustav@nordsym.com",
      website: "https://nordsym.com",
    },
    api: {
      name: "WeatherStack API",
      description: "Real-time weather data for any location worldwide. Get current conditions, forecasts, historical data, and location lookups. Supports 1M+ locations with high accuracy data from multiple sources.",
      category: "Weather",
      docsUrl: "https://weatherstack.com/documentation",
      pricingModel: "freemium",
      pricingNotes: "Free tier: 250 calls/month. Pro: 50k calls/month.",
    },
  });
  
  console.log("   API created:", apiResult);
  
  if (!apiResult || apiResult.error) {
    console.error("Failed to create API:", apiResult);
    return;
  }

  const providerId = apiResult.value?.providerId || apiResult.providerId;
  const apiId = apiResult.value?.apiId || apiResult.apiId;

  if (!providerId || !apiId) {
    console.error("Failed to get IDs from API result:", apiResult);
    return;
  }

  console.log("   Provider ID:", providerId);
  console.log("   API ID:", apiId);

  // Step 2: Add Direct Call configuration
  console.log("\n2. Setting up Direct Call config...");
  const directCallResult = await convexMutation("directCall:saveDirectCallConfig", {
    providerId: providerId,
    apiId: apiId,
    baseUrl: "https://api.weatherstack.com",
    authType: "api_key",
    authHeader: "access_key",
    authPrefix: "",
    encryptedMasterKey: "demo_key_encrypted_xxxxx", // Placeholder
    rateLimitPerUser: 60,
    rateLimitPerDay: 1000,
    pricePerRequest: 0, // Free for now
  });
  
  console.log("   Direct Call config:", directCallResult);

  if (!directCallResult || directCallResult.error) {
    console.error("Failed to create Direct Call config:", directCallResult);
    return;
  }

  const directCallId = directCallResult;

  // Step 3: Add actions
  console.log("\n3. Adding actions...");
  
  const actions = [
    {
      name: "get_current",
      displayName: "Get Current Weather",
      description: "Get current weather conditions for a location",
      method: "GET",
      path: "/current",
      params: [
        { name: "query", type: "string", required: true, description: "Location (city name, coordinates, IP)", in: "query" },
        { name: "units", type: "string", required: false, description: "Units: m (metric), f (fahrenheit), s (scientific)", in: "query", default: "m" },
      ],
      responseMapping: [
        { name: "temperature", path: "current.temperature" },
        { name: "description", path: "current.weather_descriptions[0]" },
        { name: "humidity", path: "current.humidity" },
        { name: "wind_speed", path: "current.wind_speed" },
      ],
    },
    {
      name: "get_forecast",
      displayName: "Get Weather Forecast",
      description: "Get weather forecast for upcoming days",
      method: "GET",
      path: "/forecast",
      params: [
        { name: "query", type: "string", required: true, description: "Location", in: "query" },
        { name: "forecast_days", type: "number", required: false, description: "Number of days (1-14)", in: "query", default: 7 },
        { name: "hourly", type: "boolean", required: false, description: "Include hourly data", in: "query", default: false },
      ],
      responseMapping: [
        { name: "forecast", path: "forecast" },
        { name: "location", path: "location.name" },
      ],
    },
    {
      name: "lookup_location",
      displayName: "Lookup Location",
      description: "Search for a location by name",
      method: "GET",
      path: "/autocomplete",
      params: [
        { name: "query", type: "string", required: true, description: "Location search query", in: "query" },
      ],
      responseMapping: [
        { name: "results", path: "results" },
      ],
    },
  ];

  for (const action of actions) {
    const result = await convexMutation("directCall:saveAction", {
      directCallId,
      ...action,
      enabled: true,
    });
    console.log(`   Action "${action.name}":`, result ? "✓" : "✗");
  }

  // Step 4: Publish the Direct Call config
  console.log("\n4. Publishing Direct Call...");
  await convexMutation("directCall:publishDirectCall", { id: directCallId });
  console.log("   Published ✓");

  // Step 5: Add some usage data
  console.log("\n5. Seeding usage data...");
  const now = Date.now();
  const demoAgents = ["agent_claude_prod", "agent_cursor_dev", "agent_windsurf_1", "agent_claude_user123", "agent_aider_beta"];
  
  for (let i = 0; i < 50; i++) {
    const agentId = demoAgents[Math.floor(Math.random() * demoAgents.length)];
    const actionName = actions[Math.floor(Math.random() * actions.length)].name;
    
    await convexMutation("usage:logUsage", {
      userId: agentId,
      providerId,
      directCallId,
      actionName,
      success: Math.random() > 0.02, // 98% success rate
      latencyMs: Math.floor(Math.random() * 200) + 50,
      creditsUsed: 0,
    });
  }
  console.log("   Added 50 usage entries ✓");

  console.log("\n✅ Complete! API is now live with Direct Call and usage data.");
  console.log("\nView in dashboard: https://apiclaw.cloud/providers/dashboard");
}

main().catch(console.error);
