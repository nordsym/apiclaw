"use client";

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
  if (id === "connections") return "/workspace?tab=connections&section=agents";
  return `/workspace?tab=${id}`;
}

export function StandaloneShell({ activeTab, sessionToken, children }: { activeTab: WorkspaceSurfaceId; sessionToken: string | null; children: ReactNode }) {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionToken) return;
    let cancelled = false;
    fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "workspaces:getWorkspaceDashboard", args: { token: sessionToken } }),
    })
      .then((r) => r.json())
      .then((data) => {
        const dashboard = data?.value ?? data;
        if (!cancelled && dashboard?.workspace) setWorkspace(dashboard.workspace as Workspace);
      })
      .catch((err) => console.error("Fetch workspace error:", err));
    return () => { cancelled = true; };
  }, [sessionToken]);

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
      setLogoutError("Could not sign out. Your session is still active. Try again.");
    }
  };

  const usageLabel = workspace
    ? workspace.usageLimit === -1 ? "Unlimited calls" : `${workspace.usageRemaining}/${workspace.usageLimit} calls`
    : undefined;

  return (
    <WorkspaceShell
      tabs={getWorkspaceNavigation({ isProvider: false })}
      activeTab={activeTab}
      onTabChange={(id) => router.push(hrefForTab(id))}
      workspaceName={workspace?.workspaceName || workspace?.email || "Workspace"}
      tierLabel={workspace?.tier || ""}
      usageLabel={usageLabel}
      usageLow={workspace ? workspace.usagePercentage >= 80 : false}
      onLogout={handleLogout}
    >
      {logoutError && <p className="mb-4 text-[13px] text-[var(--accent)]">{logoutError}</p>}
      {children}
    </WorkspaceShell>
  );
}
