export type WorkspaceSurfaceId =
  | "overview"
  | "api-catalog"
  | "connections"
  | "activity"
  | "billing"
  | "settings"
  | "provider-console";

export type WorkspaceNavigationItem = {
  id: WorkspaceSurfaceId;
  label: string;
};

const UNCONDITIONAL_UNLIMITED_TIERS = new Set([
  "partner",
  "founder",
]);

export function isUnlimitedWorkspace(workspace: {
  tier?: string | null;
  usageLimit?: number | null;
  paygActive?: boolean | null;
}): boolean {
  const tier = workspace.tier ?? "";
  if (UNCONDITIONAL_UNLIMITED_TIERS.has(tier)) return true;
  if (tier === "usage_based") return workspace.paygActive === true;
  return workspace.usageLimit === -1;
}

export function getAgentPresence(lastActiveAt: number, now = Date.now()): {
  state: "active" | "recent" | "inactive";
  label: string;
} {
  const elapsedMs = Math.max(0, now - lastActiveAt);
  const minute = 60_000;
  const day = 24 * 60 * minute;

  if (elapsedMs <= 15 * minute) {
    return { state: "active", label: "Active now" };
  }

  if (elapsedMs < day) {
    return {
      state: "recent",
      label: `Last seen ${Math.max(1, Math.floor(elapsedMs / minute / 60))}h ago`,
    };
  }

  const days = Math.max(1, Math.floor(elapsedMs / day));
  return {
    state: days <= 7 ? "recent" : "inactive",
    label: `Last seen ${days}d ago`,
  };
}

export function getWorkspaceNavigation({
  isProvider,
}: {
  isProvider: boolean;
}): WorkspaceNavigationItem[] {
  const navigation: WorkspaceNavigationItem[] = [
    { id: "overview", label: "Home" },
    { id: "api-catalog", label: "Catalog & Test" },
    { id: "connections", label: "Connections" },
    { id: "activity", label: "Activity" },
    { id: "billing", label: "Billing" },
    { id: "settings", label: "Settings" },
  ];

  if (isProvider) {
    navigation.push({ id: "provider-console", label: "Provider Console" });
  }

  return navigation;
}
