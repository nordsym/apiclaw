/**
 * `apiclaw mission ...` — Control Plane CLI surface.
 *
 * Reads the local session token (~/.apiclaw/session, written by
 * `apiclaw login`), routes through APIClaw's gateway, and reports
 * status / cost / events. Same workspace, same auth, same logs as MCP
 * and HTTP — fourth door, same control plane.
 */

import { readSession } from "../../session.js";

const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const MAGENTA = "\x1b[35m";

const GATEWAY =
  process.env.APICLAW_GATEWAY_URL || "https://adventurous-avocet-799.convex.site";

function color(c: string, s: string): string {
  return `${c}${s}${RESET}`;
}

function loadSession(): string | null {
  const s = readSession();
  return s?.sessionToken ?? null;
}

function authError(): never {
  console.error(color(RED, "✗ Not signed in.") + " Run: " + color(CYAN, "apiclaw login"));
  process.exit(1);
}

async function fetchJson<T = any>(
  path: string,
  init: RequestInit = {},
  token?: string,
  transportRetries = 0,
): Promise<{ status: number; body: T }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers["X-APIClaw-Session"] = token;
  let res: Response | undefined;
  let lastError: unknown;
  for (let attempt = 0; attempt <= transportRetries; attempt++) {
    try {
      res = await fetch(`${GATEWAY}${path}`, { ...init, headers });
      break;
    } catch (error) {
      lastError = error;
    }
  }
  if (!res) throw lastError;
  const text = await res.text();
  let body: any;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

function formatStatus(s: string): string {
  switch (s) {
    case "completed":
      return color(GREEN, "✓ completed");
    case "running":
      return color(CYAN, "● running");
    case "queued":
      return color(YELLOW, "○ queued");
    case "failed":
      return color(RED, "✗ failed");
    case "cancelled":
      return color(DIM, "— cancelled");
    default:
      return s;
  }
}

function parseKv(args: string[]): Record<string, string> {
  // Supports `--key value` and `--key=value`.
  const out: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!a.startsWith("--")) continue;
    if (a.includes("=")) {
      const [k, ...rest] = a.slice(2).split("=");
      out[k] = rest.join("=");
    } else {
      const k = a.slice(2);
      const v = args[i + 1];
      if (v && !v.startsWith("--")) {
        out[k] = v;
        i++;
      } else {
        out[k] = "true";
      }
    }
  }
  return out;
}

// ============================================
// SUBCOMMANDS
// ============================================

async function listTemplates() {
  const { status, body } = await fetchJson<{ templates: any[] }>("/v1/missions/templates");
  if (status !== 200) {
    console.error(color(RED, "✗ failed to fetch templates"), body);
    process.exit(1);
  }
  console.log(color(BOLD, "Available mission templates:") + "\n");
  for (const t of body.templates ?? []) {
    console.log(`  ${color(MAGENTA, t.id)}  ${color(BOLD, t.title)}`);
    console.log(`    ${color(DIM, t.description)}`);
    const params = Object.entries(t.paramSchema as Record<string, any>);
    if (params.length) {
      console.log(`    ${color(DIM, "params:")}`);
      for (const [name, def] of params) {
        const req = def.required ? color(RED, " required") : color(DIM, " optional");
        console.log(`      --${name} <${def.type}>${req}  ${color(DIM, def.description)}`);
      }
    }
    console.log("");
  }
  console.log(color(DIM, "Run: apiclaw mission start <template> --<param> <value>"));
}

async function startMission(template: string, paramArgs: string[]) {
  const token = loadSession();
  if (!token) authError();
  const params = parseKv(paramArgs);
  const idempotencyKey = params["idempotency-key"]?.trim();
  delete params["idempotency-key"];
  if (!idempotencyKey) {
    console.error(color(RED, "✗ --idempotency-key <key> is required to start a mission"));
    process.exit(1);
  }
  let response: { status: number; body: any };
  try {
    response = await fetchJson<any>(
      "/v1/missions/start",
      {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({ template, params }),
      },
      token,
    );
  } catch {
    console.error(color(RED, "✗ Mission outcome unknown."));
    console.error(`Do not submit it again. Retain operation key ${idempotencyKey} for reconciliation.`);
    process.exit(1);
  }
  const { status, body } = response;
  if (status !== 202) {
    console.error(color(RED, "✗ failed to start mission") + ":", body?.error?.message ?? body);
    process.exit(1);
  }
  console.log("");
  console.log(color(BOLD, "✓ Mission queued") + "  " + color(DIM, `(${template})`));
  console.log("  id:        " + color(CYAN, body.missionId));
  console.log("  status:    " + formatStatus(body.status));
  console.log("  pricing:   " + (body.isInternal ? color(GREEN, "internal · free") : color(YELLOW, "metered · underlying + 15%")));
  console.log("");
  console.log(color(DIM, "Watch with:  ") + color(CYAN, `apiclaw mission watch ${body.missionId}`));
}

async function getMission(id: string, opts: { events?: boolean } = {}) {
  const token = loadSession();
  if (!token) authError();
  const { status, body } = await fetchJson<any>(`/v1/missions/${encodeURIComponent(id)}`, {}, token);
  if (status !== 200) {
    console.error(color(RED, "✗ failed:"), body?.error?.message ?? body);
    process.exit(1);
  }
  const m = body.mission;
  console.log("");
  console.log(color(BOLD, m.title));
  console.log("  " + color(DIM, "id:        ") + m._id);
  console.log("  " + color(DIM, "template:  ") + color(MAGENTA, m.template));
  console.log("  " + color(DIM, "status:    ") + formatStatus(m.status));
  console.log("  " + color(DIM, "initiator: ") + (m.initiator ?? "—"));
  if (m.startedAt) console.log("  " + color(DIM, "started:   ") + new Date(m.startedAt).toISOString());
  if (m.completedAt) console.log("  " + color(DIM, "ended:     ") + new Date(m.completedAt).toISOString());
  if (typeof m.underlyingCostUsd === "number") {
    console.log("  " + color(DIM, "underlying:") + " $" + m.underlyingCostUsd.toFixed(6));
    console.log("  " + color(DIM, "charged:   ") + " $" + (m.chargedCostUsd ?? 0).toFixed(6));
  }
  if (m.error) console.log("  " + color(DIM, "error:     ") + color(RED, m.error));
  if (opts.events && body.events?.length) {
    console.log("\n" + color(BOLD, "Events:"));
    for (const e of body.events) {
      const t = new Date(e.timestamp).toISOString().slice(11, 19);
      console.log(`  ${color(DIM, t)}  ${color(MAGENTA, e.type.padEnd(14))} ${e.label}${e.costUsd ? color(DIM, ` ($${e.costUsd.toFixed(6)})`) : ""}`);
    }
  }
  if (m.status === "completed" && m.result) {
    console.log("\n" + color(BOLD, "Result:"));
    if (typeof m.result === "object" && m.result.markdown) {
      console.log(m.result.markdown);
    } else {
      console.log(JSON.stringify(m.result, null, 2));
    }
  }
}

async function watchMission(id: string) {
  const token = loadSession();
  if (!token) authError();
  let lastStatus = "";
  let lastEventCount = 0;
  while (true) {
    const { status, body } = await fetchJson<any>(`/v1/missions/${encodeURIComponent(id)}`, {}, token);
    if (status !== 200) {
      console.error(color(RED, "✗ poll failed"));
      process.exit(1);
    }
    const m = body.mission;
    if (m.status !== lastStatus) {
      process.stdout.write(`\r${formatStatus(m.status)}                 \n`);
      lastStatus = m.status;
    }
    const newEvents = (body.events ?? []).slice(lastEventCount);
    for (const e of newEvents) {
      const t = new Date(e.timestamp).toISOString().slice(11, 19);
      console.log(`  ${color(DIM, t)}  ${color(MAGENTA, e.type.padEnd(14))} ${e.label}`);
    }
    lastEventCount = body.events?.length ?? 0;
    if (m.status === "completed" || m.status === "failed" || m.status === "cancelled") {
      console.log("");
      await getMission(id, { events: false });
      break;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
}

async function listMissions(limit: number) {
  const token = loadSession();
  if (!token) authError();
  const { status, body } = await fetchJson<any>(`/v1/missions?limit=${limit}`, {}, token);
  if (status !== 200) {
    console.error(color(RED, "✗ failed:"), body);
    process.exit(1);
  }
  const missions = body.missions ?? [];
  if (missions.length === 0) {
    console.log(color(DIM, "No missions yet. Run ") + color(CYAN, "apiclaw mission templates") + color(DIM, " to see customer-ready templates."));
    return;
  }
  console.log("");
  console.log(color(BOLD, "id".padEnd(34)) + "  " + color(BOLD, "status".padEnd(13)) + "  " + color(BOLD, "template".padEnd(10)) + "  " + color(BOLD, "title"));
  for (const m of missions) {
    console.log(
      `${color(DIM, m._id.padEnd(34))}  ${formatStatus(m.status).padEnd(20)}  ${color(MAGENTA, (m.template || "").padEnd(10))}  ${m.title}`
    );
  }
}

// ============================================
// ENTRY
// ============================================

export async function missionCommand(rawArgs: string[]) {
  const sub = rawArgs[0];
  const rest = rawArgs.slice(1);
  switch (sub) {
    case undefined:
    case "list":
    case "ls": {
      const limitArg = rest.find((a) => a.startsWith("--limit"));
      const limit = limitArg ? parseInt(limitArg.split("=")[1] || rest[rest.indexOf(limitArg) + 1] || "20", 10) : 20;
      return listMissions(limit);
    }
    case "templates":
      return listTemplates();
    case "start": {
      const template = rest[0];
      if (!template) {
        console.error(color(RED, "✗ usage: apiclaw mission start <template> --idempotency-key <key> [--param value ...]"));
        console.error("  See: apiclaw mission templates");
        process.exit(1);
      }
      return startMission(template, rest.slice(1));
    }
    case "status":
    case "show":
    case "get": {
      const id = rest[0];
      if (!id) {
        console.error(color(RED, "✗ usage: apiclaw mission status <missionId>"));
        process.exit(1);
      }
      return getMission(id, { events: true });
    }
    case "watch":
    case "tail": {
      const id = rest[0];
      if (!id) {
        console.error(color(RED, "✗ usage: apiclaw mission watch <missionId>"));
        process.exit(1);
      }
      return watchMission(id);
    }
    default:
      console.error(color(RED, `✗ unknown subcommand: ${sub}`));
      console.error("  Available: list, templates, start, status, watch");
      process.exit(1);
  }
}
