// Mock data for the workspace demo
// This simulates what would come from Convex in production

export interface Provider {
  id: string;
  email: string;
  name: string;
  company?: string;
  avatarUrl?: string;
  stripeOnboardingComplete: boolean;
}

export interface Api {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  baseUrl: string;
  docsUrl?: string;
  authType: string;
  pricingModel: string;
  pricePerCall?: number;
  monthlyPrice?: number;
  rateLimitPerMinute?: number;
  regions?: string[];
  tags?: string[];
  status: "active" | "paused";
  calls: number;
  createdAt: number;
}

export interface DailyStats {
  date: string;
  calls: number;
  revenue: number;
}

export interface TopAgent {
  agentId: string;
  calls: number;
}

export interface Analytics {
  totalCalls: number;
  totalCallsWeek: number;
  totalCallsMonth: number;
  uniqueAgents: number;
  totalRevenue: number;
  revenueWeek: number;
  revenueMonth: number;
  callsByDay: DailyStats[];
  topAgents: TopAgent[];
  callsByRegion: Record<string, number>;
  apis: { id: string; name: string; calls: number; status: string }[];
}

export interface Payout {
  id: string;
  amount: number;
  status: "pending" | "processing" | "completed" | "failed";
  periodStart: number;
  periodEnd: number;
  createdAt: number;
  completedAt?: number;
}

export interface Earnings {
  pendingAmount: number;
  totalEarned: number;
  totalPaidOut: number;
  stripeConnected: boolean;
  stripeOnboardingComplete: boolean;
  payouts: Payout[];
}

// Generate realistic mock data
function generateCallsByDay(days: number): DailyStats[] {
  const result: DailyStats[] = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Growth trend with some variance and weekend dips
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseCalls = 150 + (days - i) * 3.5;
    const variance = Math.random() * 60 - 30;
    const weekendFactor = isWeekend ? 0.6 : 1;
    const calls = Math.max(20, Math.round((baseCalls + variance) * weekendFactor));
    const revenue = calls * 0.00085; // ~$0.00085 per call average
    
    result.push({
      date: date.toISOString().split("T")[0],
      calls,
      revenue: Math.round(revenue * 100) / 100,
    });
  }
  
  return result;
}

export function getMockProvider(): Provider {
  return {
    id: "provider_demo_123",
    email: "demo@example.com",
    name: "Demo Provider",
    company: "WeatherTech Inc.",
    stripeOnboardingComplete: true,
  };
}

export function getMockApis(): Api[] {
  return [
    {
      id: "api_weather_001",
      name: "WeatherAPI Pro",
      description: "Real-time weather data for 200+ countries. Includes forecasts, historical data, and severe weather alerts.",
      category: "Weather",
      icon: "🌤️",
      baseUrl: "https://api.weatherpro.example.com",
      docsUrl: "https://docs.weatherpro.example.com",
      authType: "api_key",
      pricingModel: "per_call",
      pricePerCall: 0.1, // cents
      rateLimitPerMinute: 1000,
      regions: ["US", "EU", "APAC"],
      tags: ["weather", "forecast", "climate", "alerts"],
      status: "active",
      calls: 8247,
      createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    },
    {
      id: "api_geo_002",
      name: "GeoLocator API",
      description: "IP geolocation and address lookup. High accuracy with ISP and organization data.",
      category: "Location",
      icon: "📍",
      baseUrl: "https://api.geolocator.example.com",
      docsUrl: "https://docs.geolocator.example.com",
      authType: "bearer",
      pricingModel: "per_call",
      pricePerCall: 0.05,
      rateLimitPerMinute: 500,
      regions: ["US", "EU"],
      tags: ["geo", "location", "ip", "lookup"],
      status: "active",
      calls: 4521,
      createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
    },
    {
      id: "api_translate_003",
      name: "TranslateNow API",
      description: "Neural machine translation for 100+ languages. Includes language detection.",
      category: "Translation",
      icon: "🌐",
      baseUrl: "https://api.translatenow.example.com",
      authType: "api_key",
      pricingModel: "per_call",
      pricePerCall: 0.2,
      rateLimitPerMinute: 200,
      regions: ["US", "EU", "APAC"],
      tags: ["translation", "language", "nlp"],
      status: "paused",
      calls: 1832,
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    },
  ];
}

export function getMockAnalytics(): Analytics {
  const callsByDay = generateCallsByDay(60);
  const last7Days = callsByDay.slice(-7);
  const last30Days = callsByDay.slice(-30);
  
  const totalCalls = callsByDay.reduce((sum, d) => sum + d.calls, 0);
  const totalCallsWeek = last7Days.reduce((sum, d) => sum + d.calls, 0);
  const totalCallsMonth = last30Days.reduce((sum, d) => sum + d.calls, 0);
  
  const totalRevenue = callsByDay.reduce((sum, d) => sum + d.revenue, 0);
  const revenueWeek = last7Days.reduce((sum, d) => sum + d.revenue, 0);
  const revenueMonth = last30Days.reduce((sum, d) => sum + d.revenue, 0);
  
  return {
    totalCalls,
    totalCallsWeek,
    totalCallsMonth,
    uniqueAgents: 23,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    revenueWeek: Math.round(revenueWeek * 100) / 100,
    revenueMonth: Math.round(revenueMonth * 100) / 100,
    callsByDay,
    topAgents: [
      { agentId: "agent_claude_prod", calls: 3421 },
      { agentId: "agent_gpt4_beta", calls: 2847 },
      { agentId: "agent_custom_001", calls: 1923 },
      { agentId: "agent_automation_x", calls: 1456 },
      { agentId: "agent_databot", calls: 987 },
      { agentId: "agent_insights_ai", calls: 743 },
      { agentId: "agent_pipeline_v2", calls: 521 },
      { agentId: "agent_scraper_pro", calls: 302 },
    ],
    callsByRegion: {
      US: 6234,
      EU: 4521,
      APAC: 2345,
      LATAM: 500,
    },
    apis: [
      { id: "api_weather_001", name: "WeatherAPI Pro", calls: 8247, status: "active" },
      { id: "api_geo_002", name: "GeoLocator API", calls: 4521, status: "active" },
      { id: "api_translate_003", name: "TranslateNow API", calls: 1832, status: "paused" },
    ],
  };
}

export function getMockEarnings(): Earnings {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  
  return {
    pendingAmount: 47.82,
    totalEarned: 423.45,
    totalPaidOut: 375.63,
    stripeConnected: true,
    stripeOnboardingComplete: true,
    payouts: [
      {
        id: "po_001",
        amount: 142.50,
        status: "completed",
        periodStart: now - 60 * dayMs,
        periodEnd: now - 30 * dayMs,
        createdAt: now - 29 * dayMs,
        completedAt: now - 27 * dayMs,
      },
      {
        id: "po_002",
        amount: 118.63,
        status: "completed",
        periodStart: now - 90 * dayMs,
        periodEnd: now - 60 * dayMs,
        createdAt: now - 59 * dayMs,
        completedAt: now - 57 * dayMs,
      },
      {
        id: "po_003",
        amount: 114.50,
        status: "completed",
        periodStart: now - 120 * dayMs,
        periodEnd: now - 90 * dayMs,
        createdAt: now - 89 * dayMs,
        completedAt: now - 87 * dayMs,
      },
    ],
  };
}

// API credentials mock
export interface ApiCredentials {
  apiKey: string;
  secretKey?: string;
  createdAt: number;
  lastUsed?: number;
}

export function getMockCredentials(apiId: string): ApiCredentials {
  return {
    apiKey: `apiclaw_live_${apiId.slice(-8)}_${generateRandomString(24)}`,
    secretKey: `sk_live_${generateRandomString(32)}`,
    createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
    lastUsed: Date.now() - 2 * 60 * 60 * 1000,
  };
}

function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
