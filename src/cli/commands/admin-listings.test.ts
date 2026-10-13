import assert from "node:assert/strict";
import { Command } from "commander";
import {
  decideListing,
  listPending,
  operatorRequest,
  registerListingAdmin,
} from "./admin-listings.js";
const priorToken = process.env.APICLAW_OPERATOR_TOKEN,
  priorUrl = process.env.APICLAW_OPERATOR_URL;
const nativeFetch = globalThis.fetch;
try {
  delete process.env.APICLAW_OPERATOR_TOKEN;
  await assert.rejects(listPending(), /APICLAW_OPERATOR_TOKEN/);
  process.env.APICLAW_OPERATOR_TOKEN = "synthetic-secret";
  const calls: { path: string; body?: any }[] = [];
  globalThis.fetch = (async (input: any, init: any) => {
    assert.equal(init.headers.Authorization, "Bearer synthetic-secret");
    assert.equal(init.redirect, "error");
    const path =
      new URL(String(input)).pathname + new URL(String(input)).search;
    calls.push({ path, ...(init.body ? { body: JSON.parse(init.body) } : {}) });
    if (path.includes("pending"))
      return Response.json({
        listings: [{ id: "fixture", revision: 3 }],
        nextCursor: null,
      });
    return Response.json({ ok: true });
  }) as typeof fetch;
  assert.equal((await listPending()).length, 1);
  await decideListing("fixture", true, "Verified owned fixture", 3);
  assert.deepEqual(calls.at(-1)?.body, {
    id: "fixture",
    revision: 3,
    approve: true,
    note: "Verified owned fixture",
  });
  await decideListing("fixture", false, "Missing ownership evidence");
  assert.equal(calls.at(-1)?.body.approve, false);
  const count = calls.length;
  await assert.rejects(
    decideListing("fixture", true, "Stale revision", 2),
    /Revision changed/,
  );
  assert.equal(calls.length, count + 1); // Read only; no stale POST.
  process.env.APICLAW_OPERATOR_URL = "http://external.example";
  await assert.rejects(listPending(), /HTTPS/);
  delete process.env.APICLAW_OPERATOR_URL;
  globalThis.fetch = (async () =>
    Response.json(
      { error: "Refresh current revision" },
      { status: 409 },
    )) as typeof fetch;
  await assert.rejects(operatorRequest("review", {}), /409/);
  const program = new Command().exitOverride();
  registerListingAdmin(program);
  assert(
    program.commands
      .find((c) => c.name() === "admin")
      ?.commands.find((c) => c.name() === "listings")
      ?.commands.some((c) => c.name() === "approve"),
  );
  console.log(
    "PASS: admin listings CLI uses operator bearer API, exact revision, notes, HTTPS and failure status",
  );
} finally {
  globalThis.fetch = nativeFetch;
  if (priorToken === undefined) delete process.env.APICLAW_OPERATOR_TOKEN;
  else process.env.APICLAW_OPERATOR_TOKEN = priorToken;
  if (priorUrl === undefined) delete process.env.APICLAW_OPERATOR_URL;
  else process.env.APICLAW_OPERATOR_URL = priorUrl;
}
