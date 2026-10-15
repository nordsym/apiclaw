import { cache } from "react";
import publicApis from "./workspace-public-apis.json";
import { PUBLIC_CUSTOMER_EXECUTABLE_PROVIDER_COUNT } from "./product-truth.generated";
import { CANON_STATS } from "./canon-stats.generated";

export type CallableSnapshot = {
  available: boolean;
  callableCount: number | null;
  activePublicIds: string[];
  activePublicNames: string[];
  checkedAt: number | null;
  migrationBaseline: boolean;
};

export function buildCallableSnapshot(disabledIds: string[], checkedAt: number | null, migrationBaseline = false): CallableSnapshot {
  const disabled = new Set(disabledIds);
  const active = publicApis.filter((api) => !disabled.has(api.id));
  return { available: true, callableCount: PUBLIC_CUSTOMER_EXECUTABLE_PROVIDER_COUNT + active.length,
    activePublicIds: active.map((api) => api.id), activePublicNames: active.map((api) => api.name.toLowerCase().trim()),
    checkedAt, migrationBaseline };
}

export async function loadCallableSnapshot(fetcher: typeof fetch = fetch): Promise<CallableSnapshot> {
  try {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL || "https://adventurous-avocet-799.convex.cloud";
    const response = await fetcher(`${url}/api/query`, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "publicApiHealth:snapshot", args: {} }), cache: "no-store", signal: AbortSignal.timeout(5000) });
    const data = await response.json();
    if (data.status === "error" && typeof data.errorMessage === "string"
      && /(?:could not find public function|function[^\n]*not found)/i.test(data.errorMessage)
      && data.errorMessage.includes("publicApiHealth:snapshot")) {
      return buildCallableSnapshot([], null, true);
    }
    if (!response.ok || data.status !== "success" || !Array.isArray(data.value?.disabledIds)
      || !data.value.disabledIds.every((id: unknown) => typeof id === "string")
      || !(data.value.checkedAt === null || (typeof data.value.checkedAt === "number" && Number.isFinite(data.value.checkedAt)))) {
      throw Error("Invalid callable health snapshot");
    }
    return buildCallableSnapshot(data.value.disabledIds, data.value.checkedAt);
  } catch {
    return { available: false, callableCount: null, activePublicIds: [], activePublicNames: [], checkedAt: null, migrationBaseline: false };
  }
}

// Shared by the layout and page within one server render. No browser placeholder.
export const getCallableSnapshot = typeof cache === "function"
  ? cache(() => loadCallableSnapshot()) : () => loadCallableSnapshot();

export function applyCallableSnapshot<T extends { name: string; callable?: boolean; managedAdapter?: boolean }>(rows: T[], snapshot: CallableSnapshot): T[] {
  const active = new Set(snapshot.activePublicNames);
  return rows.map((row) => row.managedAdapter ? row : { ...row, callable: row.callable === true && active.has(row.name.toLowerCase().trim()) });
}

export function callableLabel(count: number | null) {
  return count === null ? "Availability temporarily unavailable" : `${count.toLocaleString("en-US")} callable now`;
}

export function renderLiveSkill(template: string, snapshot: CallableSnapshot): string {
  const date = snapshot.checkedAt === null ? CANON_STATS.generated_at : new Date(snapshot.checkedAt).toISOString().slice(0, 10);
  return template.replace(/Live catalog \([\d-]+\)/, `Live catalog (${date})`)
    .replace(/^- [\d,]+ callable(?: now)?$/m, snapshot.available
      ? `- ${snapshot.callableCount!.toLocaleString("en-US")} callable`
      : "- Callable availability temporarily unavailable. Check https://apiclaw.cloud/api/catalog before executing.");
}
