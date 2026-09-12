"use client";
import { workspaceRequest, invalidateWorkspace } from "@/lib/workspace-data";
import { useWorkspaceRefresh, useWorkspaceRefreshEvents } from "@/lib/use-workspace-refresh";

/**
 * Shell wrapper for standalone workspace routes (/workspace/integrations,
 * /workspace/chains). Mirrors the tab list, tab navigation, identity rail
 * and sign-out of /workspace/page.tsx so these routes feel like part of the app.
 */
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getWorkspaceNavigation, type WorkspaceSurfaceId } from "@/lib/workspace-truth";
import { WorkspaceShell } from "./views/Shell";
import { CONVEX_URL, type Workspace } from "./_shared";

const SIGN_IN_PATH = "/sign-in";

export function hrefForTab(id: WorkspaceSurfaceId): string {
  if (id === "activity") return "/workspace?tab=activity&sub=logs";
  return `/workspace?tab=${id}`;
}

export function StandaloneShell({ activeTab, sessionToken, children }: { activeTab: WorkspaceSurfaceId; sessionToken: string | null; children: ReactNode }) {
  const router = useRouter();
  useWorkspaceRefreshEvents();
  const revision = useWorkspaceRefresh();
  const [isProvider, setIsProvider] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionToken) return;
    let cancelled = false;
    Promise.all([
      workspaceRequest<{ workspace: Workspace }>("query", "workspaces:getWorkspaceDashboard", { token: sessionToken }),
      workspaceRequest<{ provider: unknown }>("query", "providers:getWorkspaceProviderConsole", { token: sessionToken }),
    ]).then(([dashboard, provider]) => {
      if (cancelled) return;
      if (!dashboard?.workspace?.id) throw new Error("Workspace unavailable");
      setWorkspace(dashboard.workspace); setIsProvider(Boolean(provider.provider)); setLoadError(false);
    }).catch(() => { if (!cancelled) setLoadError(true); });
    return () => { cancelled = true; };
  }, [sessionToken, revision]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/workspace-auth/session", { method: "DELETE" });
      if (!res.ok) throw new Error("APIClaw session revocation failed");
      localStorage.removeItem("apiclaw_workspace_session");
      if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
        const clerk = (window as unknown as { Clerk?: { signOut: (opts: { redirectUrl: string }) => Promise<void> } }).Clerk;
        if (clerk?.signOut) {
          await clerk.signOut({ redirectUrl: SIGN_IN_PATH });
          return;
        }
      }
      router.push(SIGN_IN_PATH);
    } catch (err) {
      console.error("Logout error:", err);
      setLogoutError("Sign-out did not finish. Refresh to check your session, then try again.");
    }
  };

  const usageLabel = workspace
    ? workspace.usageLimit === -1 ? "Unlimited calls" : `${workspace.usageRemaining}/${workspace.usageLimit} calls`
    : undefined;

  if (!workspace) return <p role="status">{loadError ? "Could not load workspace." : "Loading workspace…"} {loadError && <button onClick={invalidateWorkspace}>Try again</button>}</p>;

  return (
    <WorkspaceShell
      tabs={getWorkspaceNavigation({ isProvider })}
      activeTab={activeTab}
      onTabChange={(id) => router.push(hrefForTab(id))}
      workspaceName={workspace?.workspaceName || workspace?.email || "Workspace"}
      tierLabel={workspace?.tier || ""}
      usageLabel={usageLabel}
      usageLow={workspace ? workspace.usagePercentage >= 80 : false}
      onLogout={handleLogout}
    >
      {loadError && <p role="alert">Account information may be out of date. <button onClick={invalidateWorkspace}>Try again</button></p>}
      {logoutError && <p className="mb-4 text-[13px] text-[var(--accent)]">{logoutError}</p>}
      {children}
    </WorkspaceShell>
  );
}
