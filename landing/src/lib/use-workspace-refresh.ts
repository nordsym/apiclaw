"use client";
import { useEffect, useSyncExternalStore, useMemo } from "react";
import { getWorkspaceRevision, invalidateWorkspace, subscribeWorkspaceData, requestGeneration } from "./workspace-data";

export function useWorkspaceRefresh() {
  return useSyncExternalStore(subscribeWorkspaceData, getWorkspaceRevision, () => 0);
}

/** Install once at the workspace boundary, not once for each panel. */
export function useWorkspaceRefreshEvents() {
  useEffect(() => {
    const refresh = () => { if (document.visibilityState !== "hidden") invalidateWorkspace(); };
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", refresh);
    const timer = window.setInterval(refresh, 30_000);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
      document.removeEventListener("visibilitychange", refresh);
      window.clearInterval(timer);
    };
  }, []);
}

/** A component's asynchronous reader must not commit after replacement/unmount. */
export function useRequestGuard() {
  const guard = useMemo(() => requestGeneration(), []);
  useEffect(() => () => guard.cancel(), [guard]);
  return guard;
}
