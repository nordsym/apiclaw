"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getSession,
  getProviderAPIs,
  getAnalytics,
  getEarnings,
  type ProviderSession,
  type ProviderAPI,
  type Analytics,
  type Earnings,
} from "@/lib/convex-client";

// Generate sample preview data for the dashboard
function generatePreviewAnalytics(): Analytics {
  const today = new Date();
  const callsByDay = [];
  
  // Generate 14 days of sample data
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const calls = Math.floor(Math.random() * 40) + 20 + Math.sin(i * 0.5) * 15;
    callsByDay.push({
      date: date.toISOString().split('T')[0],
      calls,
      revenue: 0,
    });
  }

  return {
    totalCalls: 847,
    uniqueAgents: 23,
    totalRevenue: 0,
    successRate: 98.2,
    avgLatency: 145,
    callsByDay,
    topAgents: [
      { agentId: "demo_1", calls: 234 },
      { agentId: "demo_2", calls: 189 },
      { agentId: "demo_3", calls: 156 },
      { agentId: "demo_4", calls: 98 },
      { agentId: "demo_5", calls: 67 },
    ],
    topActions: [
      { actionName: "send_message", calls: 412 },
      { actionName: "get_status", calls: 289 },
      { actionName: "create_invoice", calls: 146 },
    ],
    apis: [],
    isPreview: true,
  };
}

interface DashboardData {
  session: ProviderSession | null;
  apis: ProviderAPI[];
  analytics: Analytics | null;
  earnings: Earnings | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  logout: () => void;
}

export function useDashboardData(): DashboardData {
  const router = useRouter();
  const [session, setSession] = useState<ProviderSession | null>(null);
  const [apis, setApis] = useState<ProviderAPI[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const token = localStorage.getItem("apiclaw_session");

    if (!token) {
      router.push("/providers/dashboard/login");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Verify session first
      const sessionData = await getSession(token);

      if (!sessionData) {
        // Session expired or invalid
        localStorage.removeItem("apiclaw_session");
        localStorage.removeItem("apiclaw_provider");
        router.push("/providers/dashboard/login");
        return;
      }

      setSession(sessionData);
      
      // Update localStorage with current provider info
      localStorage.setItem("apiclaw_provider", JSON.stringify({
        name: sessionData.name,
        email: sessionData.email
      }));

      // Load all dashboard data in parallel
      const [apisData, analyticsData, earningsData] = await Promise.all([
        getProviderAPIs(sessionData.providerId),
        getAnalytics(token),
        getEarnings(token),
      ]);

      setApis(apisData || []);
      // If no real analytics, show preview data
      if (!analyticsData || analyticsData.totalCalls === 0) {
        setAnalytics(generatePreviewAnalytics());
      } else {
        setAnalytics(analyticsData);
      }
      setEarnings(earningsData);
    } catch (err) {
      console.error("Dashboard load error:", err);
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem("apiclaw_session");
    localStorage.removeItem("apiclaw_provider");
    router.push("/providers/dashboard/login");
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    session,
    apis,
    analytics,
    earnings,
    isLoading,
    error,
    refresh: loadData,
    logout,
  };
}
