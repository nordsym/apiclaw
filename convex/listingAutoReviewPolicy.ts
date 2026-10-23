import type { ListingMetadata } from "../src/listing-metadata";

export type PublishedListing = {
  id: string;
  name: string;
  docsUrl: string;
  baseUrl: string;
};

export type DeterministicInput = {
  listingId: string;
  metadata: ListingMetadata;
  submitterEmail: string;
  contactDomainReachable: boolean;
  docs: { status: number; text: string };
  target: { status: number; text: string };
  parsedSpec?: ListingMetadata;
  published: PublishedListing[];
  publishedScanComplete: boolean;
};

export type PolicyResult =
  | { outcome: "continue" }
  | { outcome: "changes_requested" | "escalate"; reason: string };

const FORBIDDEN = [
  /\b(?:porn(?:ography)?|xxx|escort\s+service|sexual\s+content)\b/i,
  /\b(?:credential\s*phish(?:ing)?|steal\s+(?:passwords?|credentials?)|seed\s+phrase\s+collector)\b/i,
  /\b(?:malware|ransomware|keylogger|botnet|remote\s+access\s+trojan)\b/i,
  /\b(?:guaranteed\s+(?:profit|returns?)|double\s+your\s+money|advance[- ]fee)\b/i,
];

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "tempmail.com",
  "example.com",
  "example.test",
]);

function canonicalUrl(value: string) {
  const url = new URL(value);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  return `${url.hostname.toLowerCase()}${path.toLowerCase()}`;
}

function meaningfulTokens(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .filter((token) => token.length >= 4 && !["api", "test", "official", "public"].includes(token)),
  );
}

export function contactDomain(email: string): string | null {
  const match = email.trim().toLowerCase().match(/^[^\s@]+@([^\s@]+)$/);
  if (!match || !match[1].includes(".") || match[1].endsWith(".")) return null;
  return match[1];
}

export function deterministicListingReview(input: DeterministicInput): PolicyResult {
  const { metadata } = input;
  if (input.docs.status < 200 || input.docs.status >= 300)
    return {
      outcome: "changes_requested",
      reason: `Documentation URL returned HTTP ${input.docs.status}; provide a public 2xx page.`,
    };
  if (input.docs.text.trim().length < 80)
    return {
      outcome: "escalate",
      reason: "Documentation returned too little readable content for an automatic decision.",
    };
  if (
    !(
      (input.target.status >= 200 && input.target.status < 300) ||
      [401, 403, 404, 405].includes(input.target.status)
    )
  )
    return {
      outcome: "changes_requested",
      reason: `API target returned HTTP ${input.target.status}; provide a reachable API base or specification URL.`,
    };

  const domain = contactDomain(input.submitterEmail);
  if (!domain || DISPOSABLE_DOMAINS.has(domain) || !input.contactDomainReachable)
    return {
      outcome: "changes_requested",
      reason: "Use a contact email on a real, reachable domain.",
    };

  const submittedText = [
    metadata.name,
    metadata.description,
    metadata.auth,
    metadata.pricing,
    metadata.pricingNotes,
    ...metadata.operations.flatMap((operation) => [operation.path, operation.summary]),
  ].join("\n");
  for (const pattern of FORBIDDEN) {
    if (pattern.test(submittedText) || pattern.test(input.docs.text.slice(0, 100_000)))
      return {
        outcome: "changes_requested",
        reason: "The listing or linked documentation contains prohibited or unsafe content.",
      };
  }

  const duplicate = input.published.find((row) => {
    if (row.id === input.listingId) return false;
    return (
      row.name.trim().toLowerCase() === metadata.name.trim().toLowerCase() ||
      canonicalUrl(row.docsUrl) === canonicalUrl(metadata.docsUrl) ||
      canonicalUrl(row.baseUrl) === canonicalUrl(metadata.baseUrl)
    );
  });
  if (duplicate)
    return {
      outcome: "changes_requested",
      reason: `This API is already published as ${duplicate.name}.`,
    };
  if (!input.publishedScanComplete)
    return {
      outcome: "escalate",
      reason: "The published-listing duplicate scan was incomplete.",
    };

  const operationKeys = metadata.operations.map(
    (operation) => `${operation.method} ${operation.path}`,
  );
  if (
    new Set(operationKeys).size !== operationKeys.length ||
    metadata.operations.some(
      (operation) =>
        !operation.summary.trim() ||
        /\s/.test(operation.path) ||
        /^\/https?:/i.test(operation.path),
    )
  )
    return {
      outcome: "changes_requested",
      reason: "Operations must be unique, relative API paths with a useful summary.",
    };

  if (input.parsedSpec) {
    const specOperations = new Set(
      input.parsedSpec.operations.map(
        (operation) => `${operation.method} ${operation.path}`,
      ),
    );
    if (operationKeys.some((operation) => !specOperations.has(operation)))
      return {
        outcome: "changes_requested",
        reason: "Submitted operations do not match the linked OpenAPI specification.",
      };
    const submittedName = meaningfulTokens(metadata.name);
    const specName = meaningfulTokens(input.parsedSpec.name);
    if (submittedName.size && ![...submittedName].some((token) => specName.has(token)))
      return {
        outcome: "changes_requested",
        reason: "Listing name does not match the linked OpenAPI specification.",
      };
  }

  const identityText = `${input.docs.text.slice(0, 60_000)} ${new URL(metadata.docsUrl).hostname} ${new URL(metadata.baseUrl).hostname}`;
  const identityTokens = meaningfulTokens(identityText);
  const nameTokens = meaningfulTokens(metadata.name);
  if (nameTokens.size && ![...nameTokens].some((token) => identityTokens.has(token)))
    return {
      outcome: "changes_requested",
      reason: "Listing name does not appear to match the documentation or API domain.",
    };

  return { outcome: "continue" };
}

export type ModelVerdict = {
  decision: "approve" | "changes_requested" | "escalate";
  reason: string;
};

export function parseModelVerdict(value: string): ModelVerdict {
  const clean = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const parsed = JSON.parse(clean);
  if (
    !["approve", "changes_requested", "escalate"].includes(parsed?.decision) ||
    typeof parsed?.reason !== "string" ||
    !parsed.reason.trim() ||
    parsed.reason.length > 240
  )
    throw Error("Invalid content judgment");
  return { decision: parsed.decision, reason: parsed.reason.trim() };
}
