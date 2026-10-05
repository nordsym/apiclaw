import { parseDocument } from "yaml";
import type { ListingMetadata } from "../../../src/listing-metadata";
export const SPEC_LIMIT = 1024 * 1024;
export function parseListingSpec(
  text: string,
  sourceUrl?: string,
): ListingMetadata {
  if (Buffer.byteLength(text) > SPEC_LIMIT)
    throw Error("Specification exceeds 1 MB");
  const doc = parseDocument(text, { uniqueKeys: true });
  if (doc.errors.length) throw Error("Invalid JSON/YAML specification");
  const spec = doc.toJS({ maxAliasCount: 0 });
  let count = 0;
  const walk = (x: unknown, depth: number) => {
    if (depth > 40 || ++count > 50000)
      throw Error("Specification is too complex");
    if (x && typeof x === "object")
      for (const [key, value] of Object.entries(x)) {
        if (
          key === "$ref" &&
          (typeof value !== "string" || !value.startsWith("#/"))
        )
          throw Error(
            "External references are not supported. Upload a bundled specification.",
          );
        walk(value, depth + 1);
      }
  };
  walk(spec, 0);
  if (
    !spec ||
    (!/^3\.(0|1)\./.test(String(spec.openapi)) && spec.swagger !== "2.0")
  )
    throw Error("Use OpenAPI 3.0/3.1 or Swagger 2.0");
  if (
    !spec.info?.title ||
    !spec.paths ||
    Array.isArray(spec.paths) ||
    typeof spec.paths !== "object"
  )
    throw Error("Specification requires info.title and paths");
  const clean = (x: unknown, n: number) =>
    typeof x === "string" ? x.trim().slice(0, n) : "";
  const operations: ListingMetadata["operations"] = [];
  for (const [path, item] of Object.entries(spec.paths)) {
    if (!path.startsWith("/") || !item || typeof item !== "object") continue;
    for (const [method, operation] of Object.entries(item))
      if (/^(get|post|put|patch|delete|head|options)$/.test(method)) {
        operations.push({
          method: method.toUpperCase(),
          path,
          summary: clean(operation?.summary, 300),
        });
        if (operations.length > 200)
          throw Error("Specifications are limited to 200 operations");
      }
  }
  if (!operations.length) throw Error("No operations found");
  const rawBase =
    spec.servers?.[0]?.url ||
    (spec.host ? `https://${spec.host}${spec.basePath || ""}` : "");
  let baseUrl = "";
  try {
    baseUrl = new URL(rawBase, sourceUrl).href;
  } catch {}
  const schemes =
    spec.components?.securitySchemes || spec.securityDefinitions || {};
  const auth = Object.values(schemes).map((s: any) =>
    s.type === "http"
      ? `HTTP ${s.scheme || "authentication"}`
      : s.type === "apiKey"
        ? "API key"
        : s.type === "oauth2"
          ? "OAuth 2"
          : s.type === "openIdConnect"
            ? "OpenID Connect"
            : "Authentication required",
  );
  return {
    name: clean(spec.info.title, 120),
    description: clean(spec.info.description, 2000),
    category: "Other",
    baseUrl,
    docsUrl:
      clean(spec.externalDocs?.url, 2048) ||
      (sourceUrl ? new URL(sourceUrl).origin : ""),
    ...(sourceUrl ? { specUrl: sourceUrl } : {}),
    auth:
      Array.from(new Set(auth)).join(", ") ||
      "Not declared; confirm with provider",
    pricing: "unknown",
    pricingNotes: "Confirm provider pricing and account limits before use.",
    operations,
  };
}
