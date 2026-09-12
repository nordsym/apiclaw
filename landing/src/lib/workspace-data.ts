import { recoverWorkspaceSessionToken } from "./workspace-session";

const URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://adventurous-avocet-799.convex.cloud";
let revision = 0;
const listeners = new Set<() => void>();
export const getWorkspaceRevision = () => revision;
export function invalidateWorkspace() {
  revision += 1;
  listeners.forEach(listener => listener());
}
export function subscribeWorkspaceData(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function decodeWorkspaceResponse(body: unknown, ok: boolean): unknown {
  const data = body as { status?: string; value?: unknown; error?: unknown; errorMessage?: string } | null;
  if (!ok || !data || data.status === "error" || data.error) {
    throw new Error(data?.errorMessage || (typeof data?.error === "string" ? data.error : "Could not load workspace data"));
  }
  const value = Object.prototype.hasOwnProperty.call(data, "value") ? data.value : data;
  if (value && typeof value === "object" && "error" in value && value.error) throw new Error(String(value.error));
  return value;
}

const arrayQueries = new Set(["agents:getWorkspaceAgents", "workspaces:getConnectedAgents", "providerKeys:listKeys", "mcpOAuth:listConnectors", "searchLogs:getRecent", "chains:getChainExecutions"]);
const arrayFields: Record<string, string> = { "apiKeys:listKeys": "keys", "agents:getSubagents": "subagents", "logs:getLogs": "logs", "providers:getWorkspaceProviderConsole": "apis" };
const numericFields: Record<string, string> = { "logs:getLogStats": "totalCalls", "searchLogs:getStats": "totalSearches", "chains:getChainStatsAuth": "total", "logs:getProviderAnalytics": "totalCalls" };
export function validateWorkspacePayload(path: string, value: unknown) {
  const record = value as Record<string, unknown> | null;
  const field = arrayFields[path];
  const numeric = numericFields[path];
  if ((arrayQueries.has(path) && !Array.isArray(value)) ||
      (field && !Array.isArray(record?.[field])) ||
      (numeric && (typeof record?.[numeric] !== "number" || !Number.isFinite(record[numeric]))) ||
      (path === "workspaceSettings:get" && typeof record?.routingMode !== "string") ||
      (path === "billing:getBillingInfo" && (!record || !("paymentMethod" in record) || !Array.isArray(record.invoices) || typeof record.creditBalance !== "number"))) {
    throw new Error("Could not verify returned workspace data");
  }
}

const nullableAuthQueries = new Set(["workspaces:getWorkspaceDashboard", "billing:getBillingInfo", "agents:getMainAgent", "logs:getProviderAnalytics", "onboarding:getState"]);
export async function workspaceRequest<T>(kind: "query" | "mutation", path: string, args: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const request = async (parameters: Record<string, unknown>) => {
    const response = await fetch(`${URL}/api/${kind}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, args: parameters }), cache: "no-store", signal,
    });
    const value = decodeWorkspaceResponse(await response.json(), response.ok);
    if (kind === "query" && value === null && nullableAuthQueries.has(path)) throw new Error("Invalid or expired session");
    if (kind === "query") validateWorkspacePayload(path, value);
    return value as T;
  };
  try {
    const value = await request(args);
    if (kind === "mutation") invalidateWorkspace();
    return value;
  } catch (error) {
    const tokenKey = typeof args.token === "string" ? "token" : typeof args.sessionToken === "string" ? "sessionToken" : null;
    if (kind !== "query" || !tokenKey || !/invalid.*session|expired.*session|session.*expired|unauthorized/i.test(String(error))) throw error;
    const token = await recoverWorkspaceSessionToken(args[tokenKey] as string);
    if (!token || signal?.aborted) throw error;
    return request({ ...args, [tokenKey]: token });
  }
}

/** Discard responses superseded by a newer request or an unmount. */
export function requestGeneration() {
  let generation = 0;
  return { next: () => ++generation, current: (id: number) => generation === id, cancel: () => { generation++; } };
}
