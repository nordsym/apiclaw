import type { WorkspaceSurfaceId } from "@/lib/workspace-truth";

export const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://adventurous-avocet-799.convex.cloud";
export const CLERK_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export interface Workspace {
  id: string;
  email: string;
  workspaceName?: string;
  tier: string;
  status: string;
  usageCount: number;
  usageLimit: number;
  usageRemaining: number;
  usagePercentage: number;
  stripeCustomerId?: string;
  stripeSubscriptionStatus?: string;
  paygActive?: boolean;
  createdAt: number;
}

export interface Agent {
  id: string;
  fingerprint: string;
  name?: string;
  customName?: string | null;
  lastUsedAt: number;
  createdAt: number;
  isCurrent: boolean;
}

export interface ConnectedAgent {
  id: string;
  fingerprint: string;
  mcpClient: string;
  name?: string;
  hostname: string;
  aiBackend?: string;
  platform?: string;
  callCount: number;
  searchCount?: number;
  firstSeenAt: number;
  lastActiveAt: number;
}

export interface UsageData {
  byProvider: { provider: string; calls: number; cost: number }[];
  byDay: { date: string; calls: number }[];
  total: number;
}

export interface ProviderAPI {
  _id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  discoveryCount?: number;
  hasDirectCall?: boolean;
}

export interface ApprovedAPI {
  _id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  hasDirectCall?: boolean;
  icon?: string;
  openApiUrl?: string;
  docsUrl?: string;
}

export interface ProviderAnalytics {
  totalCalls: number;
  uniqueAgents: number;
  avgLatency: number;
  successRate: number;
  isPreview?: boolean;
  callsByDay: { date: string; calls: number }[];
  topAgents: { agentId: string; calls: number }[];
  topActions: { actionName: string; calls: number }[];
  byCaller?: { callerKey: string; calls: number; errors: number; lastCallAt: number }[];
}

export type TabType = WorkspaceSurfaceId;
export type AnalyticsSubtab = "overview" | "usage" | "logs" | "chains";
