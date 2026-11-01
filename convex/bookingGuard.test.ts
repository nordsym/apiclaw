#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { convexTest } from "convex-test";
import { anyApi } from "convex/server";
import schema from "./schema";

const modules = {
  "./bookingGuard.ts": () => import("./bookingGuard"),
  "./_generated/server.ts": () => import("./_generated/server"),
};
const t = convexTest(schema, modules);
const bookingGuard = anyApi.bookingGuard;
const previousSecret = process.env.APICLAW_INTERNAL_SECRET;
process.env.APICLAW_INTERNAL_SECRET = "synthetic-booking-secret";

await assert.rejects(
  t.mutation(bookingGuard.consume, {
    internalSecret: "wrong",
    ip: "192.0.2.1",
    email: "one@real-domain.dev",
  }),
  /unauthorized/,
);

const consume = (ip: string, email: string) => t.mutation(bookingGuard.consume, {
  internalSecret: "synthetic-booking-secret",
  ip,
  email,
});

assert.deepEqual(await consume("192.0.2.1", "One@real-domain.dev"), {
  allowed: true,
  retryAfterSeconds: 0,
  reason: null,
});

const duplicateEmail = await consume("192.0.2.2", "one@REAL-domain.dev");
assert.equal(duplicateEmail.allowed, false);
assert.equal(duplicateEmail.reason, "email");
assert.ok(duplicateEmail.retryAfterSeconds > 86_300);

assert.equal((await consume("192.0.2.1", "two@real-domain.dev")).allowed, true);
assert.equal((await consume("192.0.2.1", "three@real-domain.dev")).allowed, true);
const fourthFromIp = await consume("192.0.2.1", "four@real-domain.dev");
assert.equal(fourthFromIp.allowed, false);
assert.equal(fourthFromIp.reason, "ip");
assert.ok(fourthFromIp.retryAfterSeconds > 3_500);

assert.equal(
  await t.run(async (ctx) => (await ctx.db.query("bookingAttempts").collect()).length),
  6,
  "only three accepted bookings should create the paired IP/email rows",
);

await t.run(async (ctx) => {
  await ctx.db.insert("bookingAttempts", {
    key: "ip:expired",
    kind: "ip",
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000 - 1,
  });
});
assert.equal((await consume("192.0.2.3", "fresh@real-domain.dev")).allowed, true);
assert.equal(
  await t.run(async (ctx) =>
    (await ctx.db.query("bookingAttempts").collect()).some((row) => row.key === "ip:expired")),
  false,
  "bounded cleanup should delete expired rows",
);

if (previousSecret === undefined) delete process.env.APICLAW_INTERNAL_SECRET;
else process.env.APICLAW_INTERNAL_SECRET = previousSecret;

console.log("convex booking guard: durable IP/email limits and cleanup passed");
