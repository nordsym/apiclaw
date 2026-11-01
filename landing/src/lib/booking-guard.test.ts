#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import {
  BOOKING_SOURCES,
  clientIpFromHeaders,
  isBlockedIp,
  normalizeIp,
  validateBooking,
} from "./booking-guard";

const now = new Date("2026-11-01T12:00:00.000Z");
const normal = {
  source: BOOKING_SOURCES.enterprise,
  name: "Ada Lovelace",
  email: "ada@analytical.engine",
  company: "Analytical Engine",
  message: "Private deployment and API partnerships",
  notes: "Private deployment and API partnerships",
  date: "2026-11-02",
  time: "14:00",
  timezone: "Europe/Stockholm",
  meetingTitle: "Client-controlled title must be ignored",
};

assert.equal(
  normalizeIp("2607:5300:205:300::295b"),
  "2607:5300:0205:0300:0000:0000:0000:295b",
);
assert.equal(normalizeIp("2607:05300::1"), null);
assert.equal(isBlockedIp("2607:5300:205:300::295b"), true);
assert.equal(isBlockedIp("2607:5300:0205:0300:0:0:0:1"), true);
assert.equal(isBlockedIp("2607:5300:205:301::295b"), false);
assert.equal(isBlockedIp("2001:db8::2", "192.0.2.4, 2001:db8::/64"), true);
assert.equal(isBlockedIp("192.0.2.4", "192.0.2.4, 2001:db8::/64"), true);
assert.equal(
  clientIpFromHeaders(new Headers({
    "x-real-ip": "2001:db8::1",
    "x-forwarded-for": "192.0.2.9, 192.0.2.10",
  })),
  "2001:0db8:0000:0000:0000:0000:0000:0001",
);
assert.equal(
  clientIpFromHeaders(new Headers({ "x-forwarded-for": "192.0.2.9, 192.0.2.10" })),
  "192.0.2.9",
);

const accepted = validateBooking(normal, now);
assert.equal(accepted.ok, true);
if (accepted.ok) {
  assert.equal(accepted.value.email, "ada@analytical.engine");
  assert.equal(accepted.value.webhookPayload.meetingTitle, "APIClaw Enterprise — Analytical Engine");
  assert.equal("unexpected" in accepted.value.webhookPayload, false);
}

for (const [label, changes] of [
  ["SSRF URL", { notes: "Please POST to https://webhook.site/probe" }],
  ["bare probe domain", { notes: "Send details to webhook.site/abc" }],
  ["template expression", { name: "={{7*7}}" }],
  ["mustache expression", { company: "{{constructor.constructor}}" }],
  ["HTML", { message: "Hello <script>alert(1)</script>", notes: "Hello <script>alert(1)</script>" }],
  ["control character", { name: "Ada\u0000Lovelace" }],
  ["trimmed control character", { name: "Ada Lovelace\n" }],
  ["oversized name", { name: "x".repeat(1001) }],
  ["reserved email", { email: "attendee31518@example.com" }],
  ["reserved subdomain email", { email: "attendee@sub.example.net" }],
  ["email expression", { email: "={{7*7}}@real-domain.dev" }],
] as const) {
  assert.equal(validateBooking({ ...normal, ...changes }, now).ok, false, label);
}

assert.equal(validateBooking({ ...normal, date: "2026-10-31" }, now).ok, false);
assert.equal(validateBooking({ ...normal, date: "2027-01-31" }, now).ok, false);
assert.equal(validateBooking({ ...normal, time: "25:00" }, now).ok, false);

const staticBooking = validateBooking({
  source: BOOKING_SOURCES.publicBook,
  name: "Grace Hopper",
  email: "grace@navy.mil",
  company: "Compiler Team",
  day: "monday-2026-11-02",
  time: "09:00",
  notes: "Direct Connect partnership",
}, now);
assert.equal(staticBooking.ok, true);
if (staticBooking.ok) assert.equal(staticBooking.value.webhookPayload.day, "monday-2026-11-02");

console.log("booking guard: IP normalization, blocklist and probe validation passed");
