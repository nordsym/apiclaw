// Simple Convex HTTP client for the dashboard

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://brilliant-puffin-712.eu-west-1.convex.cloud";

export async function convexQuery<T>(path: string, args: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });

  if (!response.ok) {
    throw new Error(`Convex query failed: ${response.statusText}`);
  }

  return response.json();
}

export async function convexMutation<T>(path: string, args: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });

  if (!response.ok) {
    throw new Error(`Convex mutation failed: ${response.statusText}`);
  }

  return response.json();
}

// Provider dashboard types
export interface ProviderSession {
  providerId: string;
  email: string;
  name: string;
  stripeOnboardingComplete?: boolean;
}

export interface ProviderAPI {
  _id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  openApiUrl?: string;
  docsUrl?: string;
  pricingModel: string;
  pricingNotes?: string;
  discoveryCount?: number;
  createdAt: number;
}

export interface DailyStats {
  date: string;
  calls: number;
  revenue: number;
}

export interface Analytics {
  totalCalls: number;
  uniqueAgents: number;
  totalRevenue: number;
  callsByDay: DailyStats[];
  topAgents: { agentId: string; calls: number }[];
  callsByRegion: Record<string, number>;
  apis: { id: string; name: string; calls: number; status: string }[];
}

export interface Earnings {
  pendingAmount: number;
  totalEarned: number;
  totalPaidOut: number;
  stripeConnected: boolean;
  stripeOnboardingComplete: boolean;
  payouts: {
    id: string;
    amount: number;
    status: string;
    periodStart: number;
    periodEnd: number;
    createdAt: number;
    completedAt?: number;
  }[];
}

// Get session
export async function getSession(token: string): Promise<ProviderSession | null> {
  return convexQuery("providers:getSession", { token });
}

// Get provider APIs
export async function getProviderAPIs(providerId: string): Promise<ProviderAPI[]> {
  return convexQuery("providers:getProviderAPIs", { providerId });
}

// Get analytics
export async function getAnalytics(token: string, period?: string): Promise<Analytics | null> {
  return convexQuery("providers:getAnalytics", { token, period });
}

// Get earnings
export async function getEarnings(token: string): Promise<Earnings | null> {
  return convexQuery("providers:getEarnings", { token });
}
