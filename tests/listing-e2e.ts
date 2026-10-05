/** Real React UI, Next route handlers, Convex functions and remote MCP dispatcher.
 * Database is isolated in convex-test. Browser uses bundled headless Chromium.
 * Set LISTING_LIVE_SPEC=1 to additionally import Arcmira's public spec over HTTPS.
 */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { convexTest } from "convex-test";
import { anyApi } from "convex/server";
import schema from "../convex/schema";
const require = createRequire(import.meta.url);
const { buildSync } = require("esbuild");
const { NextRequest } = require("../landing/node_modules/next/server");
const runtimeModules = process.env.CODEX_NODE_MODULES;
const { chromium } = runtimeModules
  ? require(path.join(runtimeModules, "playwright"))
  : require("playwright");
const root = process.cwd(),
  temporary = mkdtempSync(path.join(tmpdir(), "apiclaw-listing-e2e-"));
const modules: Record<string, () => Promise<any>> = {};
for (const f of readdirSync(path.join(root, "convex")))
  if (f.endsWith(".ts") && !f.endsWith(".test.ts"))
    modules["./" + f] = () =>
      import(pathToFileURL(path.join(root, "convex", f)).href);
modules["./_generated/server.ts"] = () => import("../convex/_generated/server");
const t = convexTest(schema, modules),
  api = anyApi.discoveryListings;
const token = "st_listing_test_owner";
await t.run(async (ctx) => {
  const id = await ctx.db.insert("workspaces", {
    email: "listing-e2e@example.test",
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
const nativeFetch = globalThis.fetch;
let catalogGET: any, importPOST: any;
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url!, origin);
    let result: Response;
    if (url.pathname === "/fixture.js") {
      res.setHeader("content-type", "text/javascript");
      res.end(readFileSync(path.join(temporary, "fixture.js")));
      return;
    }
    if (url.pathname === "/api/catalog")
      result = await catalogGET(new NextRequest(url));
    else if (url.pathname === "/api/listings/import") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      result = await importPOST(
        new NextRequest(url, {
          method: "POST",
          headers: req.headers,
          body: Buffer.concat(chunks),
        }),
      );
    } else if (
      url.pathname === "/api/query" ||
      url.pathname === "/api/mutation"
    ) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const { path: fn, args } = JSON.parse(Buffer.concat(chunks).toString());
      const [file, method] = fn.split(":");
      assert.ok(
        ["discoveryListings", "workspaces"].includes(file),
        "Unexpected database module: " + file,
      );
      assert.ok(
        !["review", "pending"].includes(method),
        "Internal functions must not be callable through HTTP",
      );
      const value = await (url.pathname === "/api/query"
        ? t.query(anyApi[file][method], args)
        : t.mutation(anyApi[file][method], args));
      result = Response.json({ status: "success", value });
    } else if (url.pathname.startsWith("/v1/")) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      result = await t.fetch(url.pathname, {
        method: req.method,
        headers: req.headers as any,
        body: Buffer.concat(chunks).toString(),
      });
    } else if (url.pathname === "/api/discover")
      result = Response.json({ providers: [] });
    else {
      res.setHeader("content-type", "text/html");
      res.end(
        '<!doctype html><html><body><div id="root"></div><script src="/fixture.js"></script></body></html>',
      );
      return;
    }
    res.writeHead(result.status, Object.fromEntries(result.headers));
    res.end(await result.text());
  } catch (e) {
    res.writeHead(400, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "error", errorMessage: String(e) }));
  }
});
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://localhost:${(server.address() as any).port}`;
process.env.NEXT_PUBLIC_CONVEX_URL = origin;
({ GET: catalogGET } = require("../landing/src/app/api/catalog/route.ts"));
({
  POST: importPOST,
} = require("../landing/src/app/api/listings/import/route.ts"));
const {
  dispatchCanonicalTool,
} = require("../landing/src/lib/mcp-tools-canon.ts");
// Convex's actual /v1/discover fetches the public catalog URL. Route only that
// request back to the actual local Next handler; all other fetches stay local.
globalThis.fetch = (async (input: any, init: any) => {
  const url = new URL(
    typeof input === "string" ? input : input.url || input.toString(),
  );
  if (url.origin === "https://apiclaw.cloud" && url.pathname === "/api/catalog")
    return catalogGET(new NextRequest(origin + url.pathname + url.search));
  assert.equal(url.origin, origin, "Unexpected outbound fetch");
  return nativeFetch(input, init);
}) as typeof fetch;
buildSync({
  entryPoints: [path.join(root, "landing/tests/listings/entry.tsx")],
  bundle: true,
  outfile: path.join(temporary, "fixture.js"),
  platform: "browser",
  jsx: "automatic",
  nodePaths: [path.join(root, "landing/node_modules")],
  tsconfig: path.join(root, "landing/tsconfig.json"),
  define: {
    "process.env.NODE_ENV": '"development"',
    "process.env.NEXT_PUBLIC_CONVEX_URL": JSON.stringify(origin),
    "process.env.NEXT_PUBLIC_APICLAW_GATEWAY_URL": JSON.stringify(origin),
  },
});
process.chdir(path.join(root, "landing"));
let browser: any, page: any;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  page = await context.newPage();
  page.setDefaultTimeout(12000);
  const errors: string[] = [];
  page.on("pageerror", (e: Error) => errors.push(e.message));
  await context.route("**/*", async (route: any) => {
    assert.equal(
      new URL(route.request().url()).origin,
      origin,
      "Unexpected browser network",
    );
    await route.continue();
  });
  await page.goto(origin);
  await page.getByRole("tab", { name: "My APIs" }).click();
  await page.getByRole("button", { name: "Add API", exact: true }).click();
  await page
    .getByLabel("OpenAPI file")
    .setInputFiles(path.join(root, "tests/fixtures/arcmira-discovery.json"));
  await page
    .getByRole("button", { name: "Import specification", exact: true })
    .click();
  await page.getByRole("heading", { name: "Preview listing" }).waitFor();
  await page
    .getByLabel("Provider pricing", { exact: true })
    .fill("Free and paid plans");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page
    .getByRole("button", { name: "Submit for review", exact: true })
    .waitFor();
  let row = (await t.query(api.mine, { token }))[0];
  assert.equal(
    (await (await nativeFetch(origin + "/api/catalog?q=Arcmira")).json()).items
      .length,
    0,
  );
  await page
    .getByRole("button", { name: "Submit for review", exact: true })
    .click();
  await page
    .getByText("Submitted for review. Your status will appear here.")
    .waitFor();
  assert.equal(
    (await (await nativeFetch(origin + "/api/catalog?q=Arcmira")).json()).items
      .length,
    0,
  );
  await t.mutation(api.review, {
    id: row._id,
    revision: 1,
    approve: true,
    reviewer: "Isolated test",
    note: "Synthetic fixture only; not a real provider approval",
  });
  await page.reload();
  await page.getByRole("tab", { name: "My APIs" }).click();
  await page.getByRole("link", { name: "Find in catalog" }).click();
  await page.getByText(row.draft.name, { exact: true }).waitFor();
  assert.equal(
    await page.getByText("Run a test call", { exact: true }).count(),
    0,
  );
  assert.equal(
    await page
      .getByRole("link", { name: "Docs", exact: true })
      .getAttribute("href"),
    "https://arcmira.com/docs",
  );
  const discover: any = await dispatchCanonicalTool(
    "discover_apis",
    { query: "Arcmira", callable_only: false },
    { bearer: token },
  );
  assert.equal(discover.apis.length, 1);
  assert.equal(discover.apis[0].name, row.draft.name);
  assert.equal(discover.apis[0].callable, false);
  const callable: any = await dispatchCanonicalTool(
    "discover_apis",
    { query: "Arcmira", callable_only: true },
    { bearer: token },
  );
  assert.equal(callable.apis.length, 0);
  for (const [endpoint, body] of [
    [
      "/v1/execute",
      { provider: "listing:" + row._id, action: "search", params: {} },
    ],
    ["/v1/call", { api: "listing:" + row._id, method: "GET", path: "/" }],
  ] as const) {
    const result = await nativeFetch(origin + endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-APIClaw-Session": token,
      },
      body: JSON.stringify(body),
    });
    assert.equal(result.status, 403, await result.clone().text());
    assert.match(await result.text(), /discovery_only/);
  }
  const invalid = await nativeFetch(origin + "/api/listings/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(invalid.status, 401);
  const crossOrigin = await nativeFetch(origin + "/api/listings/import", {
    method: "POST",
    headers: { Origin: "https://evil.example", "X-APIClaw-Session": token },
    body: "{}",
  });
  assert.equal(crossOrigin.status, 403);
  const unsafe = await nativeFetch(origin + "/api/listings/import", {
    method: "POST",
    headers: { "X-APIClaw-Session": token },
    body: JSON.stringify({ url: "https://127.0.0.1/openapi" }),
  });
  assert.equal(unsafe.status, 400);
  if (process.env.LISTING_LIVE_SPEC === "1") {
    await page.getByRole("tab", { name: "My APIs" }).click();
    await page.getByRole("button", { name: "Add API", exact: true }).click();
    await page
      .getByLabel("OpenAPI URL", { exact: true })
      .fill("https://api.arcmira.com/v1/openapi.json");
    await page
      .getByRole("button", { name: "Import specification", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Preview listing" })
      .waitFor({ timeout: 20000 });
    assert.equal(
      await page.getByLabel("Name", { exact: true }).inputValue(),
      "Arcmira API",
    );
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await page
      .getByText("Draft saved. Submit it for review from My APIs.")
      .waitFor();
    console.log(
      "PASS: live Arcmira OpenAPI URL imported via browser (metadata GET only)",
    );
  }
  await page.goto(origin + "/?view=my-apis");
  await page.getByRole("button", { name: "Unpublish", exact: true }).click();
  await page
    .getByRole("button", { name: "Unpublish", exact: true })
    .waitFor({ state: "detached" });
  const hidden: any = await dispatchCanonicalTool(
    "discover_apis",
    { query: row.draft.name, callable_only: false },
    { bearer: token },
  );
  assert.equal(hidden.apis.length, 0);
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
      assert.equal((await ctx.db.query(table).take(1)).length, 0, table);
  });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: new free workspace -> browser file import -> preview -> draft -> submit -> private operator approval -> catalog -> discover_apis -> execution denied -> unpublish; no keys, execution or payment records",
  );
} catch (e) {
  console.error(await page?.locator("body").innerText());
  throw e;
} finally {
  await browser?.close();
  globalThis.fetch = nativeFetch;
  process.chdir(root);
  await new Promise<void>((resolve) => server.close(() => resolve()));
  rmSync(temporary, { recursive: true, force: true });
}
