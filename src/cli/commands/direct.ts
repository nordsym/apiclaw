/**
 * Direct CLI parity with the MCP tool surface — `apiclaw discover|call|
 * details|balance`. Thin wrappers over the gateway so a CLI user has the
 * same control plane as the MCP user.
 */

import { readSession } from "../../session.js";

const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const CYAN = "\x1b[36m";

const GATEWAY =
  process.env.APICLAW_GATEWAY_URL || "https://adventurous-avocet-799.convex.site";

function color(c: string, s: string): string { return `${c}${s}${RESET}`; }

function authHeader(): Record<string, string> {
  const s = readSession();
  if (!s?.sessionToken) {
    console.error(color(RED, "✗ Not signed in.") + " Run: " + color(CYAN, "apiclaw login"));
    process.exit(1);
  }
  return { "X-APIClaw-Session": s.sessionToken };
}

function parseJson(s: string | undefined, label: string): unknown {
  if (!s) return undefined;
  try { return JSON.parse(s); }
  catch { console.error(color(RED, `✗ --${label} must be valid JSON`)); process.exit(1); }
}

async function gateway<T = any>(path: string, method: "GET" | "POST", body?: unknown, auth = true): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) Object.assign(headers, authHeader());
  const init: RequestInit = { method, headers };
  if (method === "POST") init.body = JSON.stringify(body ?? {});
  const res = await fetch(`${GATEWAY}${path}`, init);
  const text = await res.text();
  let parsed: any; try { parsed = JSON.parse(text); } catch { parsed = text; }
  if (!res.ok) {
    console.error(color(RED, `✗ ${path}`) + ` — ${parsed?.error?.message ?? parsed}`);
    process.exit(1);
  }
  return parsed as T;
}

// ============================================
// COMMANDS
// ============================================

export async function discoverCommand(query: string, opts: { category?: string; callable?: boolean; limit?: number }) {
  const data = await gateway<any>("/v1/discover", "POST", {
    query,
    category: opts.category,
    callable_only: opts.callable ?? false,
    limit: opts.limit ?? 10,
  }, false);
  const apis = data.apis ?? [];
  const managed = data.managedProviders ?? [];
  if (managed.length) {
    console.log(color(BOLD, "Managed providers:"));
    for (const m of managed.slice(0, 5)) {
      console.log(`  ${color(CYAN, m.providerId.padEnd(16))} ${m.name} ${color(DIM, "— " + (m.description ?? ""))}`);
    }
    console.log("");
  }
  console.log(color(BOLD, `${apis.length} APIs:`));
  for (const a of apis.slice(0, opts.limit ?? 10)) {
    const flag = a.callable ? color(GREEN, "✓") : color(DIM, "○");
    console.log(`  ${flag} ${color(CYAN, a.name.padEnd(28))} ${color(DIM, a.category ?? "")}`);
  }
  if ((data.hasMore ?? false)) console.log(color(DIM, `  …${data.total - apis.length} more — refine with --category or --callable`));
}

export async function callCommand(api: string, opts: { path?: string; method?: string; params?: string; body?: string; async?: boolean }) {
  const data = await gateway<any>("/v1/call", "POST", {
    api,
    path: opts.path ?? "/",
    method: (opts.method ?? "GET").toUpperCase(),
    params: parseJson(opts.params, "params"),
    body: parseJson(opts.body, "body"),
  });
  console.log(JSON.stringify(data, null, 2));
}

export async function detailsCommand(api: string) {
  const data = await gateway<any>("/api/details", "POST", { name: api }, false);
  console.log(JSON.stringify(data, null, 2));
}

export async function balanceCommand() {
  const data = await gateway<any>("/api/balance", "POST", {});
  console.log("");
  console.log(color(BOLD, "Workspace balance"));
  if (data.email) console.log("  " + color(DIM, "email:    ") + data.email);
  if (data.tier) console.log("  " + color(DIM, "tier:     ") + color(CYAN, data.tier));
  if (typeof data.usageCount === "number") {
    const limit = data.usageLimit ?? 0;
    console.log("  " + color(DIM, "usage:    ") + `${data.usageCount}${limit > 0 ? ` / ${limit}` : ""} this period`);
  }
  if (typeof data.weeklyUsageCount === "number") {
    console.log("  " + color(DIM, "weekly:   ") + `${data.weeklyUsageCount}${data.weeklyUsageLimit ? ` / ${data.weeklyUsageLimit}` : ""}`);
  }
  if (data.creditBalance !== undefined) {
    console.log("  " + color(DIM, "credits:  ") + `$${(data.creditBalance / 100).toFixed(2)}`);
  }
  console.log("");
}
