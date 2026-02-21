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

      // Load all dashboard data in parallel
      const [apisData, analyticsData, earningsData] = await Promise.all([
        getProviderAPIs(sessionData.providerId),
        getAnalytics(token),
        getEarnings(token),
      ]);

      setApis(apisData || []);
      setAnalytics(analyticsData);
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
