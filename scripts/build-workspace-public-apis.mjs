#!/usr/bin/env node
/**
 * Build the workspace-authenticated public API allowlist.
 *
 * Reads the public catalog + exact-name verification, keeps no-key HTTPS
 * origins that are not spec/docs hosts or managed-adapter aliases, and
 * writes src/workspace-public-apis.json plus a JSON.parse data module.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, "..");
const REGISTRY = resolve(ROOT, "src/registry/apis.json");
const VERIFICATION = resolve(ROOT, "landing/src/lib/verification-status.json");
const PRODUCT_TRUTH = resolve(ROOT, "src/product-truth.ts");
const JSON_OUTPUT = resolve(ROOT, "src/workspace-public-apis.json");
const DATA_OUTPUT = resolve(ROOT, "src/workspace-public-apis.data.ts");

const DOCS_OR_SPEC_HOSTS = new Set([
  "api.apis.guru",
  "api.swaggerhub.com",
  "virtserver.swaggerhub.com",
  "documenter.getpostman.com",
  "github.com",
  "www.github.com",
  "gitlab.com",
  "www.gitlab.com",
  "raw.githubusercontent.com",
  "developers.google.com",
  "developer.mozilla.org",
  "developer.amazon.com",
  "developer.apple.com",
  "developer.bitcoin.org",
  "developers.adidas.com",
]);

const DOCS_HOST_SUFFIXES = [".github.io", ".readme.io", ".gitbook.io", ".notion.site"];

const CURATED = [
  { id: "frankfurter", name: "Frankfurter", baseUrl: "https://api.frankfurter.dev/v1", origin: "https://api.frankfurter.dev" },
  { id: "coingecko", name: "CoinGecko", baseUrl: "https://api.coingecko.com/api/v3", origin: "https://api.coingecko.com" },
  { id: "kroki", name: "Kroki", baseUrl: "https://kroki.io", origin: "https://kroki.io" },
];

function normalize(value) {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function isNoKey(auth) {
  const value = String(auth ?? "").trim().toLowerCase();
  return value === "" || value === "none" || value === "no" || value === "nokey" ||
    value === "no key" || value === "no-auth" || value === "noauth" ||
    value === "public" || value === "open";
}

function isJunkName(name) {
  const value = String(name ?? "").trim();
  if (value.length < 2 || value.length > 120) return true;
  if (value.includes("${") || value.includes("{")) return true;
  if (/^\(?title\)?$/i.test(value)) return true;
  if (/\bdeprecated\b/i.test(value)) return true;
  return false;
}

function isBlockedHost(host) {
  if (DOCS_OR_SPEC_HOSTS.has(host)) return true;
  if (DOCS_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))) return true;
  if (host.startsWith("docs.") || host.startsWith("developer.") || host.startsWith("developers.")) {
    return true;
  }
  return false;
}

function safeUrl(value) {
  if (typeof value !== "string" || value.includes("${") || value.includes("{")) return undefined;
  let url;
  try {
    url = new URL(value);
  } catch {
    return undefined;
  }
  const path = url.pathname.toLowerCase();
  if (
    path.endsWith(".html") ||
    path.endsWith(".htm") ||
    path.endsWith("/docs") ||
    path.endsWith("/docs/") ||
    path.includes("/developers") ||
    path.includes("/documentation")
  ) {
    return undefined;
  }
  if (url.protocol !== "https:") return undefined;
  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" || host === "0.0.0.0" || host === "127.0.0.1" || host === "::1" ||
    host.endsWith(".local") || host.endsWith(".internal") ||
    /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  ) {
    return undefined;
  }
  if (isBlockedHost(host)) return undefined;
  return url;
}

function managedAliases() {
  const source = readFileSync(PRODUCT_TRUTH, "utf8");
  const aliases = new Set();
  const block = source.match(/export const MANAGED_PROVIDER_ADAPTERS = \[[\s\S]*?\] as const/);
  if (!block) throw new Error("MANAGED_PROVIDER_ADAPTERS not found");
  for (const match of block[0].matchAll(/id:\s*"([^"]+)"/g)) aliases.add(normalize(match[1]));
  for (const match of block[0].matchAll(/name:\s*"([^"]+)"/g)) aliases.add(normalize(match[1]));
  for (const match of block[0].matchAll(/"([^"]+)"/g)) {
    const value = normalize(match[1]);
    if (value) aliases.add(value);
  }
  return aliases;
}

const registry = JSON.parse(readFileSync(REGISTRY, "utf8"));
const verification = JSON.parse(readFileSync(VERIFICATION, "utf8"));
const managed = managedAliases();

const seen = new Set();
const harvested = [];

for (const api of registry.apis ?? []) {
  const name = String(api.name ?? "").trim();
  if (!name || !isNoKey(api.auth) || isJunkName(name)) continue;
  if (managed.has(normalize(name))) continue;
  const evidence = verification.by_name_lower?.[name.toLowerCase()];
  if (evidence?.tier === "dead") continue;
  const url = safeUrl(api.baseUrl);
  if (!url) continue;
  const key = normalize(name);
  if (!key || seen.has(key)) continue;
  seen.add(key);
  harvested.push({
    id: key.slice(0, 64),
    name,
    baseUrl: url.toString().replace(/\/$/, ""),
    origin: url.origin,
  });
}

const curated = [];
for (const api of CURATED) {
  const keys = [normalize(api.name), normalize(api.id)];
  if (keys.some((key) => seen.has(key))) continue;
  for (const key of keys) seen.add(key);
  curated.push(api);
}

const allowlist = [...curated, ...harvested].sort((a, b) => a.name.localeCompare(b.name));

const compact = JSON.stringify(allowlist);
writeFileSync(JSON_OUTPUT, compact + "\n");
writeFileSync(
  DATA_OUTPUT,
  `/**
 * Generated by scripts/build-workspace-public-apis.mjs.
 * Compact JSON.parse payload so TypeScript does not type a 1,003-object literal.
 */
export const WORKSPACE_PUBLIC_APIS_JSON = ${JSON.stringify(compact)};
`,
);
console.log(`wrote ${allowlist.length} workspace-public APIs (${curated.length} curated, ${harvested.length} harvested no-key)`);
