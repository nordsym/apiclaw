import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url),
  { buildSync } = require("esbuild"),
  { NextRequest } = require("../landing/node_modules/next/server");
const temporary = mkdtempSync(path.join(tmpdir(), "listing-review-route-"));
const globals = globalThis as any;
const prior = process.env.APICLAW_INTERNAL_SECRET;
try {
  buildSync({
    stdin: {
      contents: `import {GET,POST} from './landing/src/app/api/listings/review/route'; export {GET,POST};`,
      resolveDir: process.cwd(),
      sourcefile: "review-route-test.ts",
    },
    bundle: true,
    platform: "node",
    format: "cjs",
    outfile: path.join(temporary, "route.cjs"),
    tsconfig: "landing/tsconfig.json",
    alias: {
      "@clerk/nextjs/server": path.join(
        process.cwd(),
        "tests/fixtures/listing-review-clerk.cjs",
      ),
      "@/lib/convex": path.join(
        process.cwd(),
        "tests/fixtures/listing-review-convex.cjs",
      ),
    },
    external: ["next/server"],
    nodePaths: [path.join(process.cwd(), "landing/node_modules")],
  });
  // The isolated bundle resolves Next through the installed landing runtime.
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
  const { GET, POST } = require(path.join(temporary, "route.cjs"));
  Module._resolveFilename = original;
  globals.__listingOperator = null;
  globals.__listingCalls = [];
  process.env.APICLAW_INTERNAL_SECRET = "synthetic-route-secret";
  assert.equal(
    (await GET(new NextRequest("https://apiclaw.cloud/api/listings/review")))
      .status,
    403,
  );
  const request = (origin: string | undefined, body: any) =>
    new NextRequest("https://apiclaw.cloud/api/listings/review", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(origin ? { Origin: origin } : {}),
      },
      body: JSON.stringify(body),
    });
  const body = {
    id: "synthetic",
    revision: 1,
    approve: true,
    note: "Synthetic ownership evidence",
    reviewer: "forged",
    internalSecret: "forged",
  };
  assert.equal(
    (await POST(request("https://apiclaw.cloud", body))).status,
    403,
  );
  globals.__listingOperator = {
    emailAddresses: [
      {
        emailAddress: "gustav@nordsym.com",
        verification: { status: "verified" },
      },
    ],
  };
  assert.equal((await POST(request(undefined, body))).status, 403);
  assert.equal((await POST(request("https://evil.example", body))).status, 403);
  assert.equal(
    (await POST(request("https://apiclaw.cloud", { ...body, note: "" })))
      .status,
    400,
  );
  assert.equal(globals.__listingCalls.length, 0);
  assert.equal(
    (await POST(request("https://apiclaw.cloud", body))).status,
    200,
  );
  assert.equal(globals.__listingCalls[0].args.reviewer, "gustav@nordsym.com");
  assert.equal(
    globals.__listingCalls[0].args.internalSecret,
    "synthetic-route-secret",
  );
  globals.__listingFailure = true;
  assert.equal(
    (await POST(request("https://apiclaw.cloud", body))).status,
    409,
  );
  console.log(
    "PASS: real review route denies non-operators/CSRF, requires notes, ignores forged identity and handles stale reviews",
  );
} finally {
  for (const key of ["__listingOperator", "__listingCalls", "__listingFailure"])
    delete globals[key];
  if (prior === undefined) delete process.env.APICLAW_INTERNAL_SECRET;
  else process.env.APICLAW_INTERNAL_SECRET = prior;
  rmSync(temporary, { recursive: true, force: true });
}
