#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { parseAcpCommand } from "./acp-grammar.js";

// empty input -> unparseable (help fallback)
assert.deepEqual(parseAcpCommand(""), { kind: "unparseable" });
assert.deepEqual(parseAcpCommand("   "), { kind: "unparseable" });

// help, case-insensitive, extra whitespace
assert.deepEqual(parseAcpCommand("help"), { kind: "help" });
assert.deepEqual(parseAcpCommand("HELP"), { kind: "help" });
assert.deepEqual(parseAcpCommand("  Help  "), { kind: "help" });

// status / balance, case-insensitive
assert.deepEqual(parseAcpCommand("status"), { kind: "status" });
assert.deepEqual(parseAcpCommand("STATUS"), { kind: "status" });
assert.deepEqual(parseAcpCommand("balance"), { kind: "balance" });
assert.deepEqual(parseAcpCommand("Balance"), { kind: "balance" });

// discover
assert.deepEqual(parseAcpCommand("discover weather apis"), {
  kind: "discover",
  query: "weather apis",
});
assert.deepEqual(parseAcpCommand("  DISCOVER   weather apis  "), {
  kind: "discover",
  query: "weather apis",
});
assert.deepEqual(parseAcpCommand("discover"), { kind: "unparseable" });
assert.deepEqual(parseAcpCommand("discover   "), { kind: "unparseable" });

// details, with and without action
assert.deepEqual(parseAcpCommand("details nasa"), { kind: "details", provider: "nasa" });
assert.deepEqual(parseAcpCommand("details nasa/apod"), {
  kind: "details",
  provider: "nasa",
  action: "apod",
});
assert.deepEqual(parseAcpCommand("DETAILS   nasa/apod  "), {
  kind: "details",
  provider: "nasa",
  action: "apod",
});
assert.deepEqual(parseAcpCommand("details"), { kind: "unparseable" });

// call without trailing JSON
assert.deepEqual(parseAcpCommand("call nasa/apod"), { kind: "call", target: "nasa/apod" });
assert.deepEqual(parseAcpCommand("  CALL   nasa/apod  "), { kind: "call", target: "nasa/apod" });

// call with trailing JSON params
assert.deepEqual(parseAcpCommand('call nasa/apod {"date":"2024-01-01"}'), {
  kind: "call",
  target: "nasa/apod",
  params: { date: "2024-01-01" },
});

// call with invalid JSON -> paramsError, not a throw
{
  const result = parseAcpCommand("call nasa/apod {not json}");
  assert.equal(result.kind, "call");
  assert.equal((result as any).target, "nasa/apod");
  assert.ok((result as any).paramsError, "invalid JSON must produce a paramsError, not throw");
}

// call with JSON that isn't an object -> paramsError
{
  const result = parseAcpCommand("call nasa/apod [1,2,3]");
  assert.equal(result.kind, "call");
  assert.ok((result as any).paramsError, "non-object JSON must produce a paramsError");
}

// call without provider/action target
assert.deepEqual(parseAcpCommand("call"), { kind: "unparseable" });

// unparseable / unrecognized keyword
assert.deepEqual(parseAcpCommand("frobnicate the widget"), { kind: "unparseable" });
assert.deepEqual(parseAcpCommand("discoverx foo"), { kind: "unparseable" });

console.log("acp grammar parses help/discover/details/call/balance/status and falls back to unparseable");
