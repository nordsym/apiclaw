/**
 * APIClaw Funnel — client-side emitter for MCP server.
 *
 * Fire-and-forget POST to Convex funnel:recordEvent. Never throws, never
 * blocks. See convex/funnel.ts for schema and classification rules.
 */
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const CONVEX_URL = process.env.CONVEX_URL || "https://adventurous-avocet-799.convex.cloud";

export type FunnelEventName =
  | "install"
  | "first_run"
  | "register_owner"
  | "verify_code"
  | "first_call_api_success"
  // Diagnostics
  | "register_owner_failed"
  | "verify_code_failed"
  | "call_api_blocked"
  | "call_api_error"
  | "quota_hit"
  | "gateway_retry";

export type Classification = "human" | "ci" | "bot" | "internal";

const CI_ENV_KEYS = [
  "CI",
  "GITHUB_ACTIONS",
  "GITLAB_CI",
  "CIRCLECI",
  "BUILDKITE",
  "JENKINS_URL",
  "TEAMCITY_VERSION",
  "TRAVIS",
  "BITBUCKET_BUILD_NUMBER",
];

const BOT_UA_MARKERS = [
  "bot",
  "crawl",
  "spider",
  "scanner",
  "curl/",
  "wget/",
  "httpclient",
  "python-requests",
  "go-http-client",
  "okhttp",
  "java/",
  "httrack",
  "headlesschrome",
  "phantomjs",
];

const INTERNAL_EMAIL_DOMAINS = ["nordsym.com", "apiclaw.cloud"];
const INTERNAL_EMAIL_EXACT = ["gustav@nordsym.com", "gustavnordsync@gmail.com"];

export function classifyLocalSource(input: {
  userAgent?: string | null;
  email?: string | null;
  fingerprint?: string | null;
  env?: NodeJS.ProcessEnv;
}): Classification {
  const email = (input.email || "").toLowerCase().trim();
  if (email) {
    if (INTERNAL_EMAIL_EXACT.includes(email)) return "internal";
    const domain = email.split("@")[1] || "";
    if (INTERNAL_EMAIL_DOMAINS.includes(domain)) return "internal";
  }
  const env = input.env || process.env;
  for (const key of CI_ENV_KEYS) {
    const val = env[key];
    if (val && val !== "false" && val !== "0") return "ci";
  }
  const ua = (input.userAgent || "").toLowerCase();
  if (ua) {
    for (const m of BOT_UA_MARKERS) {
      if (ua.includes(m)) return "bot";
    }
  }
  return "human";
}

// Persistent first-run marker stored alongside the session file.
const MARKER_DIR = path.join(os.homedir(), ".apiclaw");
const MARKER_FILE = path.join(MARKER_DIR, "funnel-markers.json");

function readMarkers(): Record<string, number> {
  try {
    if (!fs.existsSync(MARKER_FILE)) return {};
    return JSON.parse(fs.readFileSync(MARKER_FILE, "utf8")) || {};
  } catch {
    return {};
  }
}

function writeMarkers(m: Record<string, number>): void {
  try {
    if (!fs.existsSync(MARKER_DIR)) fs.mkdirSync(MARKER_DIR, { mode: 0o700 });
    fs.writeFileSync(MARKER_FILE, JSON.stringify(m), { mode: 0o600 });
  } catch {
    /* ignore */
  }
}

export function hasLocalMarker(key: string): boolean {
  return !!readMarkers()[key];
}

export function setLocalMarker(key: string): void {
  const m = readMarkers();
  m[key] = Date.now();
  writeMarkers(m);
}

export interface EmitArgs {
  event: FunnelEventName;
  workspaceId?: string;
  fingerprint?: string;
  sessionToken?: string;
  email?: string;
  mcpClient?: string;
  platform?: string;
  version?: string;
  dedupeKey?: string;
  props?: Record<string, unknown>;
}

export function emitFunnelEvent(args: EmitArgs): void {
  if (process.env.APICLAW_TELEMETRY === "false") return;

  const classification = classifyLocalSource({
    email: args.email,
    fingerprint: args.fingerprint,
  });

  const payload = {
    path: "funnel:recordEvent",
    args: {
      event: args.event,
      classification,
      workspaceId: args.workspaceId,
      fingerprint: args.fingerprint,
      sessionToken: args.sessionToken,
      email: args.email,
      userAgent: `apiclaw-mcp/${args.version || "unknown"}`,
      mcpClient: args.mcpClient,
      platform: args.platform || process.platform,
      version: args.version,
      dedupeKey: args.dedupeKey,
      props: args.props,
    },
  };

  // Fire and forget.
  try {
    fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}
