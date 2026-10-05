import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { convexTest } from "convex-test";
import { anyApi } from "convex/server";
import schema from "./schema";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { parseListingSpec } = require("../landing/src/lib/listing-import.ts");
const {
  loadPublishedListings,
  mergePublishedListings,
} = require("../landing/src/lib/published-listings.ts");
const {
  publicAddress,
  publicSpecUrl,
} = require("../landing/src/lib/listing-fetch.ts");
const modules = {
  "./discoveryListings.ts": () => import("./discoveryListings"),
  "./_generated/server.ts": () => import("./_generated/server"),
};
const t = convexTest(schema, modules);
const api = anyApi.discoveryListings;
for (const token of ["owner", "stranger"])
  await t.run(async (ctx) => {
    const id = await ctx.db.insert("workspaces", {
      email: token + "@example.test",
      status: "active",
      tier: "free",
      usageCount: 0,
      usageLimit: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await ctx.db.insert("agentSessions", {
      workspaceId: id,
      sessionToken: token,
      sessionKind: "owner",
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
    });
  });
await assert.rejects(
  t.mutation(api.importPermit, { token: "invalid" }),
  /session/,
);
for (let i = 0; i < 30; i++)
  assert.equal(await t.mutation(api.importPermit, { token: "owner" }), true);
assert.equal(await t.mutation(api.importPermit, { token: "owner" }), false);
assert.equal(await t.mutation(api.importPermit, { token: "stranger" }), true);
const text = readFileSync("tests/fixtures/arcmira-discovery.json", "utf8");
const metadata = parseListingSpec(
  text,
  "https://api.arcmira.com/v1/openapi.json",
);
assert.equal(metadata.auth, "HTTP bearer");
assert.equal(metadata.operations.length, 1);
assert.throws(
  () =>
    parseListingSpec(
      JSON.stringify({
        ...JSON.parse(text),
        external: { $ref: "https://example.com/external.json" },
      }),
    ),
  /External references/,
);
assert.throws(() => parseListingSpec("x: &x [*x]"), /alias|Alias/);
assert.throws(() => parseListingSpec(" ".repeat(1024 * 1024 + 1)), /1 MB/);
for (const url of [
  "http://example.com/spec",
  "https://127.0.0.1/spec",
  "https://localhost/spec",
  "https://user:pass@example.com/spec",
  "https://example.com/spec?key=secret",
  "https://example.com:8443/spec",
])
  assert.throws(() => publicSpecUrl(url));
for (const ip of [
  "127.0.0.1",
  "10.0.0.1",
  "169.254.169.254",
  "172.16.0.1",
  "192.168.0.1",
  "0.0.0.0",
  "100.64.0.1",
  "224.0.0.1",
  "::1",
])
  assert.equal(publicAddress(ip), false, ip);
assert.equal(publicAddress("8.8.8.8"), true);
await assert.rejects(
  t.mutation(api.saveDraft, { token: "invalid", metadata }),
  /session/,
);
const reserved = await t.mutation(api.saveDraft, {
  token: "owner",
  metadata: { ...metadata, name: "OpenRouter" },
});
await t.mutation(api.submit, { token: "owner", id: reserved, revision: 1 });
await assert.rejects(
  t.mutation(api.review, {
    id: reserved,
    revision: 1,
    approve: true,
    reviewer: "test",
    note: "reserved",
  }),
  /existing execution/,
);
const id = await t.mutation(api.saveDraft, { token: "owner", metadata });
const page = () =>
  t.query(api.published, { paginationOpts: { numItems: 100, cursor: null } });
assert.equal((await page()).page.length, 0);
await assert.rejects(
  t.mutation(api.saveDraft, { token: "stranger", id, revision: 1, metadata }),
  /not found/,
);
await assert.rejects(
  t.mutation(api.submit, { token: "stranger", id, revision: 1 }),
  /not found/,
);
await t.mutation(api.submit, { token: "owner", id, revision: 1 });
assert.equal((await page()).page.length, 0);
await assert.rejects(
  t.mutation(api.review, {
    id,
    revision: 2,
    approve: true,
    reviewer: "test operator",
    note: "Synthetic fixture reviewed",
  }),
  /stale/,
);
await t.mutation(api.review, {
  id,
  revision: 1,
  approve: false,
  reviewer: "test operator",
  note: "Confirm pricing",
});
assert.equal((await page()).page.length, 0);
await t.mutation(api.saveDraft, {
  token: "owner",
  id,
  revision: 1,
  metadata: {
    ...metadata,
    pricing: "paid",
    pricingNotes: "Provider account budget applies.",
  },
});
await t.mutation(api.submit, { token: "owner", id, revision: 2 });
await t.mutation(api.review, {
  id,
  revision: 2,
  approve: true,
  reviewer: "test operator",
  note: "Fixture ownership and content reviewed; discovery only",
});
let card = (await page()).page[0];
assert.equal(card.callable, false);
assert.equal(card.managedAdapter, false);
assert.equal(card.executionAvailable, false);
assert.equal(card.providerId, "listing:" + id);
assert.equal(card.workspaceId, undefined);
assert.equal(card.reviewNote, undefined);
const listingFetcher = (async (_url: any, init: any) => {
  const args = JSON.parse(init.body).args;
  return new Response(
    JSON.stringify({
      status: "success",
      value: await t.query(api.published, args),
    }),
  );
}) as typeof fetch;
const catalog = mergePublishedListings(
  [],
  await loadPublishedListings(listingFetcher),
);
assert.equal(catalog[0].name, metadata.name);
assert.equal(catalog.filter((x: any) => x.callable).length, 0);
await t.mutation(api.saveDraft, {
  token: "owner",
  id,
  revision: 2,
  metadata: { ...metadata, description: "UNREVIEWED CHANGE" },
});
assert.notEqual((await page()).page[0].description, "UNREVIEWED CHANGE");
await assert.rejects(
  t.mutation(api.review, {
    id,
    revision: 2,
    approve: true,
    reviewer: "test",
    note: "stale",
  }),
  /stale/,
);
await assert.rejects(
  t.mutation(api.unpublish, { token: "stranger", id }),
  /not found/,
);
await t.mutation(api.submit, { token: "owner", id, revision: 3 });
await t.mutation(api.review, {
  id,
  revision: 3,
  approve: false,
  reviewer: "test",
  note: "Unreviewed changes rejected",
});
assert.notEqual((await page()).page[0].description, "UNREVIEWED CHANGE");
await t.mutation(api.unpublish, { token: "owner", id });
assert.equal((await page()).page.length, 0);
await t.run(async (ctx) => {
  for (const table of [
    "providers",
    "providerAPIs",
    "providerDirectCall",
    "providerKeys",
    "managedCallLedger",
    "purchases",
    "usageRecords",
  ] as const)
    assert.equal(
      (await ctx.db.query(table).take(1)).length,
      0,
      table + " must stay untouched",
    );
});
const mod = await import("./discoveryListings");
assert.equal((mod.review as any).isInternal, true);
assert.equal((mod.pending as any).isInternal, true);
console.log(
  "PASS: import, ownership, rejection, revision-safe approval, discovery, withdrawal and zero execution/billing/key side effects",
);
