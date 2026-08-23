#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const source = readFileSync(
  fileURLToPath(new URL("./billing.ts", import.meta.url)),
  "utf8",
);

// getBillingInfo must be a public query (not internalQuery), gated by
// findUsableAgentSession, and must return null rather than throw on an
// invalid/expired session; a missing session must never fall through to
// buildBillingInfo.
assert.match(
  source,
  /export const getBillingInfo = query\(/,
  "getBillingInfo must be a public query",
);

const getBillingInfoStart = source.indexOf("export const getBillingInfo = query(");
const getBillingInfoEnd = source.indexOf("\n});", getBillingInfoStart) + 4;
const getBillingInfoBlock = source.slice(getBillingInfoStart, getBillingInfoEnd);

assert.match(
  getBillingInfoBlock,
  /const session = await findUsableAgentSession\(ctx\.db, token\);/,
  "getBillingInfo must authenticate via findUsableAgentSession",
);

assert.match(
  getBillingInfoBlock.slice(0, getBillingInfoBlock.indexOf("buildBillingInfo")),
  /if \(!session\) return null;/,
  "getBillingInfo must return null (not throw) on an unusable session, before touching workspace data",
);

// The shared payload builder must never surface Stripe secrets or other
// tenants' identifiers alongside the legitimate cached Stripe object ids.
const buildStart = source.indexOf("async function buildBillingInfo(");
const buildEnd = source.indexOf("\n}", buildStart) + 2;
const buildBillingInfoBlock = source.slice(buildStart, buildEnd);
assert.ok(buildStart >= 0, "buildBillingInfo helper must exist");

const forbiddenTokens = ["stripeApiKey", "STRIPE_SECRET_KEY", "webhookSecret", "sessionToken"];
for (const token of forbiddenTokens) {
  assert.ok(
    !getBillingInfoBlock.includes(token) && !buildBillingInfoBlock.includes(token),
    `billing.ts must never wire ${token} into the billing info payload`,
  );
}

console.log("billing security: getBillingInfo is a session-gated public query that fails soft and never leaks secrets");
