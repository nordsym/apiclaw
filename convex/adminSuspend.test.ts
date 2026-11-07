#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { suspendWorkspaceInTransaction } from "./adminSuspend";

type Row = Record<string, any> & { _id: string };

const now = 1_800_000_000_000;
const targetId = "n177f9mgy2hq89s6thpt4cqran8hdg5c";
const founderId = "n178829315bfdwpryfs20nmjf9821774";
const rows: Record<string, Row> = {
  [targetId]: { _id: targetId, status: "active", updatedAt: 1 },
  [founderId]: { _id: founderId, status: "active", updatedAt: 2 },
  keyActive: { _id: "keyActive", workspaceId: targetId },
  keyRevoked: { _id: "keyRevoked", workspaceId: targetId, revokedAt: 50 },
  keyFounder: { _id: "keyFounder", workspaceId: founderId },
  sessionDurable: { _id: "sessionDurable", workspaceId: targetId },
  sessionBrowser: { _id: "sessionBrowser", workspaceId: targetId, expiresAt: now + 60_000 },
  sessionExpired: { _id: "sessionExpired", workspaceId: targetId, expiresAt: now - 1 },
  sessionFounder: { _id: "sessionFounder", workspaceId: founderId },
};

const db = {
  get: async (id: string) => rows[id] ?? null,
  patch: async (id: string, patch: Record<string, unknown>) => Object.assign(rows[id], patch),
  query: (table: "workspaceApiKeys" | "agentSessions") => ({
    withIndex: (_index: string, apply: (q: any) => unknown) => {
      let workspaceId = "";
      apply({ eq: (_field: string, value: string) => { workspaceId = value; } });
      const prefix = table === "workspaceApiKeys" ? "key" : "session";
      return {
        collect: async () => Object.values(rows).filter(
          (row) => row._id.startsWith(prefix) && row.workspaceId === workspaceId,
        ),
      };
    },
  }),
};

const result = await suspendWorkspaceInTransaction(
  db as any,
  { workspaceId: targetId as any, reason: " attacker 2026-11-01 " },
  now,
);
assert.deepEqual(result, {
  workspaceId: targetId,
  previousStatus: "active",
  status: "suspended",
  revokedKeys: 1,
  expiredSessions: 2,
});
assert.deepEqual(rows[targetId], {
  _id: targetId,
  status: "suspended",
  suspendedAt: now,
  suspensionReason: "attacker 2026-11-01",
  updatedAt: now,
});
assert.equal(rows.keyActive.revokedAt, now);
assert.equal(rows.keyRevoked.revokedAt, 50, "existing key revocation is preserved");
assert.equal(rows.sessionDurable.expiresAt, now);
assert.equal(rows.sessionBrowser.expiresAt, now);
assert.equal(rows.sessionExpired.expiresAt, now - 1, "existing session expiry is preserved");
assert.deepEqual(rows[founderId], { _id: founderId, status: "active", updatedAt: 2 });
assert.equal(rows.keyFounder.revokedAt, undefined);
assert.equal(rows.sessionFounder.expiresAt, undefined);

const replay = await suspendWorkspaceInTransaction(
  db as any,
  { workspaceId: targetId as any, reason: "attacker 2026-11-01" },
  now + 1,
);
assert.equal(replay.revokedKeys, 0);
assert.equal(replay.expiredSessions, 0);
assert.equal(rows[targetId].suspendedAt, now, "original suspension time is preserved");

await assert.rejects(
  suspendWorkspaceInTransaction(db as any, { workspaceId: "missing" as any, reason: "test" }, now),
  /workspace_not_found/,
);
await assert.rejects(
  suspendWorkspaceInTransaction(db as any, { workspaceId: targetId as any, reason: "  " }, now),
  /suspension_reason_required/,
);

const source = readFileSync(fileURLToPath(new URL("./adminSuspend.ts", import.meta.url)), "utf8");
assert.match(source, /export const suspendWorkspace = internalMutation\(/);
assert.match(source, /export const getWorkspaceIdentity = internalQuery\(/);
assert.match(source, /export const getSuspensionState = internalQuery\(/);
assert.doesNotMatch(source, /export const suspendWorkspace = mutation\(/);
assert.doesNotMatch(source, /\.delete\(/, "suspension retains every record");
console.log("Admin suspension: internal-only, non-destructive, scoped revocation passed");
