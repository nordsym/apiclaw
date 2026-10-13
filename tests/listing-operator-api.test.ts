import assert from "node:assert/strict";
import { mock } from "node:test";
mock.timers.enable({ apis: ["setTimeout"] });
import { convexTest } from "convex-test";
import { anyApi } from "convex/server";
import schema from "../convex/schema";
import { createRequire } from "node:module";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
const require = createRequire(import.meta.url),
  { buildSync } = require("esbuild");
const { NextRequest } = require("../landing/node_modules/next/server");
const temporary = mkdtempSync(path.join(tmpdir(), "operator-route-"));
const g = globalThis as any;
const t = convexTest(schema, {
  "./discoveryListings.ts": () => import("../convex/discoveryListings"),
  "./listingNotifications.ts": () => import("../convex/listingNotifications"),
  "./_generated/server.ts": () => import("../convex/_generated/server"),
});
const prior = {
  token: process.env.APICLAW_OPERATOR_TOKEN,
  secret: process.env.APICLAW_INTERNAL_SECRET,
};
process.env.APICLAW_OPERATOR_TOKEN = "test-operator-token-".repeat(3);
process.env.APICLAW_INTERNAL_SECRET = "test-operator-bridge";
const api = anyApi.discoveryListings;
try {
  buildSync({
    stdin: {
      contents: `export {GET} from './landing/src/app/api/internal/listings/pending/route'; export {POST} from './landing/src/app/api/internal/listings/review/route';`,
      resolveDir: process.cwd(),
    },
    bundle: true,
    platform: "node",
    format: "cjs",
    outfile: path.join(temporary, "routes.cjs"),
    tsconfig: "landing/tsconfig.json",
    alias: {
      "@/lib/convex": path.join(
        process.cwd(),
        "tests/fixtures/listing-review-convex.cjs",
      ),
    },
    external: ["next/server"],
    nodePaths: [path.join(process.cwd(), "landing/node_modules")],
  });
  const Module = require("module"),
    original = Module._resolveFilename;
  Module._resolveFilename = function (id: string, ...args: any[]) {
    return original.call(
      this,
      id === "next/server"
        ? path.join(process.cwd(), "landing/node_modules/next/server.js")
        : id,
      ...args,
    );
  };
  const { GET, POST } = require(path.join(temporary, "routes.cjs"));
  Module._resolveFilename = original;
  g.__listingCalls = [];
  g.__listingBackend = async (kind: string, name: string, args: any) =>
    t[kind === "query" ? "query" : "mutation"](
      (anyApi as any)[name.split(":")[0]][name.split(":")[1]],
      args,
    );
  const request = (
    method: string,
    token?: string,
    body?: any,
    agent = "Codex",
  ) =>
    new NextRequest(
      "https://apiclaw.cloud/api/internal/listings/" +
        (method === "GET" ? "pending" : "review"),
      {
        method,
        headers: {
          ...(token ? { Authorization: "Bearer " + token } : {}),
          "X-APIClaw-Agent": agent,
          "Content-Type": "application/json",
        },
        ...(body && method === "POST" ? { body: JSON.stringify(body) } : {}),
      },
    );
  for (const token of [undefined, "wrong", "wrong".repeat(20)])
    for (const method of ["GET", "POST"])
      assert.equal(
        (await (method === "GET" ? GET : POST)(request(method, token, {})))
          .status,
        401,
      );
  assert.equal(g.__listingCalls.length, 0);
  const token = process.env.APICLAW_OPERATOR_TOKEN;
  assert.equal(
    (await GET(request("GET", token, undefined, "operator:forged"))).status,
    400,
  );
  const workspaceId = await t.run((ctx) =>
    ctx.db.insert("workspaces", {
      email: "synthetic@example.test",
      tier: "free",
      status: "active",
      usageCount: 0,
      usageLimit: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }),
  );
  const metadata = {
    name: "Synthetic operator API",
    description: "No real service",
    category: "Testing",
    baseUrl: "https://example.test/",
    docsUrl: "https://example.test/docs",
    auth: "None",
    pricing: "None",
    pricingNotes: "Synthetic",
    operations: [
      { method: "GET", path: "/does-not-exist", summary: "Never execute" },
    ],
  };
  const id = await t.run((ctx) =>
    ctx.db.insert("discoveryListings", {
      workspaceId,
      draft: metadata,
      nameKey: metadata.name.toLowerCase(),
      revision: 1,
      reviewState: "pending",
      isPublished: false,
      submittedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }),
  );
  const queue = await (await GET(request("GET", token))).json();
  assert.deepEqual(
    queue.listings.map((r: any) => ({
      id: r.id,
      revision: r.revision,
      email: r.submitter.email,
    })),
    [{ id, revision: 1, email: "synthetic@example.test" }],
  );
  const body = {
    id,
    revision: 1,
    approve: true,
    note: "Owned synthetic fixture",
    reviewer: "forged",
    internalSecret: "forged",
  };
  assert.equal(
    (await POST(request("POST", token, { ...body, note: "" }))).status,
    400,
  );
  assert.equal(
    (await POST(request("POST", token, { ...body, revision: 2 }))).status,
    409,
  );
  assert.equal((await POST(request("POST", token, body))).status, 200);
  const published = await t.query(api.published, {
    paginationOpts: { numItems: 25, cursor: null },
  });
  assert.equal(published.page.length, 1);
  assert.equal(published.page[0].callable, false);
  assert.equal(published.page[0].executionAvailable, false);
  assert.equal((await POST(request("POST", token, body))).status, 409);
  await t.run((ctx) =>
    ctx.db.patch(id, { revision: 2, reviewState: "pending" }),
  );
  assert.equal(
    (
      await POST(
        request(
          "POST",
          token,
          {
            ...body,
            revision: 2,
            approve: false,
            note: "Need ownership evidence",
          },
          "Claude",
        ),
      )
    ).status,
    200,
  );
  const audits = await t.run((ctx) =>
    ctx.db
      .query("discoveryListingReviews")
      .withIndex("by_listing", (q) => q.eq("listingId", id))
      .collect(),
  );
  assert.deepEqual(
    audits.map((r) => [r.reviewer, r.decision, r.revision]),
    [
      ["operator-token:Codex", "approved", 1],
      ["operator-token:Claude", "changes_requested", 2],
    ],
  );
  assert(audits.every((r) => r.note && r.reviewedAt > 0));
  // Rejecting a revised draft preserves the previously approved snapshot, never publishes the rejected revision.
  assert.equal(
    (
      await t.query(api.published, {
        paginationOpts: { numItems: 25, cursor: null },
      })
    ).page.length,
    1,
  );
  for (const table of [
    "providers",
    "providerAPIs",
    "providerKeys",
    "providerDirectCall",
    "managedCallLedger",
    "usageRecords",
    "purchases",
  ])
    assert.equal(
      (await t.run((ctx) => ctx.db.query(table as any).collect())).length,
      0,
      table,
    );
  assert.equal((await t.run((ctx) => ctx.db.get(workspaceId)))!.usageCount, 0);
  const rejectedId = await t.run((ctx) =>
    ctx.db.insert("discoveryListings", {
      workspaceId,
      draft: { ...metadata, name: "Reject fixture" },
      nameKey: "reject fixture",
      revision: 1,
      reviewState: "pending",
      isPublished: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }),
  );
  assert.equal(
    (
      await POST(
        request("POST", token, { ...body, id: rejectedId, approve: false }),
      )
    ).status,
    200,
  );
  assert.equal(
    (await t.run((ctx) => ctx.db.get(rejectedId)))!.isPublished,
    false,
  );
  for (let i = 0; i < 120; i++)
    await t.mutation(api.operatorPermit, {
      internalSecret: process.env.APICLAW_INTERNAL_SECRET!,
      reviewer: "operator-token:Codex",
    });
  assert.equal(
    (await GET(request("GET", token, undefined, "different-agent"))).status,
    429,
  );
  console.log(
    "PASS: real operator routes + Convex auth, durable rate limit, exact revision, approval/rejection audit, published snapshot and zero execution/key/billing effects",
  );
} finally {
  for (const key of ["__listingCalls", "__listingBackend"]) delete g[key];
  for (const [key, value] of Object.entries({
    APICLAW_OPERATOR_TOKEN: prior.token,
    APICLAW_INTERNAL_SECRET: prior.secret,
  })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  rmSync(temporary, { recursive: true, force: true });
}
