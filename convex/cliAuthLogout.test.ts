#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import {
  resolvePreviousCliCredentials,
  revokeCliCredentials,
  revokeResolvedCliCredentials,
} from "./cliAuth";

type Session = Doc<"agentSessions">;
type ApiKey = Doc<"workspaceApiKeys">;

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function fakeDb(initial: { sessions: Session[]; apiKeys?: ApiKey[] }): {
  db: MutationCtx["db"];
  sessions: Session[];
  apiKeys: ApiKey[];
  patched: string[];
  deleted: string[];
} {
  const state = {
    sessions: [...initial.sessions],
    apiKeys: [...(initial.apiKeys ?? [])],
    patched: [] as string[],
    deleted: [] as string[],
  };

  const db = {
    query: (table: "agentSessions" | "workspaceApiKeys") => ({
      withIndex: (
        _index: string,
        select: (q: { eq: (field: string, value: unknown) => unknown }) => unknown,
      ) => {
        let field = "";
        let value: unknown;
        select({
          eq: (selectedField, selectedValue) => {
            field = selectedField;
            value = selectedValue;
            return {};
          },
        });
        const rows = table === "agentSessions" ? state.sessions : state.apiKeys;
        const matches = () => rows.filter((row) => (row as unknown as Record<string, unknown>)[field] === value);
        return {
          first: async () => matches()[0] ?? null,
          collect: async () => matches(),
        };
      },
    }),
    patch: async (id: string, value: Record<string, unknown>) => {
      state.patched.push(id);
      const row = state.apiKeys.find((candidate) => candidate._id === id);
      if (row) Object.assign(row, value);
    },
    delete: async (id: string) => {
      state.deleted.push(id);
      state.sessions = state.sessions.filter((candidate) => candidate._id !== id);
    },
  } as unknown as MutationCtx["db"];

  return { db, ...state };
}

const now = Date.UTC(2026, 6, 19, 12);
const owner = {
  _id: "owner-id",
  _creationTime: now,
  workspaceId: "workspace-id",
  sessionToken: "durable-session-token",
  sessionKind: "owner",
  lastUsedAt: now,
  createdAt: now,
} as unknown as Session;
const child = {
  ...owner,
  _id: "browser-child-id",
  sessionToken: "browser-session-token",
  sessionKind: "browser",
  parentSessionId: owner._id,
  expiresAt: now + 60_000,
} as unknown as Session;
const rawApiKey = "sk-claw-exact-cli-key";
const apiKey = {
  _id: "api-key-id",
  _creationTime: now,
  workspaceId: owner.workspaceId,
  key: "",
  keyHash: sha256(rawApiKey),
  keyPrefix: "sk-claw-...-key",
  name: "cli-auth 2026-07-19",
  createdAt: now,
} as unknown as ApiKey;

const valid = fakeDb({ sessions: [owner, child], apiKeys: [apiKey] });
assert.deepEqual(
  await revokeCliCredentials(valid.db, {
    sessionToken: owner.sessionToken,
    apiKey: rawApiKey,
  }),
  { success: true, revokedApiKey: true },
);
assert.deepEqual(valid.patched, [apiKey._id], "the exact CLI-held API key is revoked");
assert.deepEqual(
  valid.deleted,
  [child._id, owner._id],
  "browser children are removed before the durable owner session",
);

const mismatch = fakeDb({ sessions: [owner, child], apiKeys: [apiKey] });
assert.deepEqual(
  await revokeCliCredentials(mismatch.db, {
    sessionToken: owner.sessionToken,
    apiKey: "sk-claw-different-key",
  }),
  { success: false, error: "api_key_mismatch" },
);
assert.deepEqual(mismatch.patched, []);
assert.deepEqual(mismatch.deleted, [], "a failed ownership check changes nothing");

const browserOnly = fakeDb({ sessions: [child] });
assert.deepEqual(
  await revokeCliCredentials(browserOnly.db, { sessionToken: child.sessionToken }),
  { success: false, error: "invalid_session" },
  "a short-lived browser bearer cannot revoke its durable owner",
);
assert.deepEqual(browserOnly.deleted, []);

const legacy = fakeDb({ sessions: [owner] });
assert.deepEqual(
  await revokeCliCredentials(legacy.db, { sessionToken: owner.sessionToken }),
  { success: true, revokedApiKey: false },
  "legacy CLI configs without an API key can still revoke their session",
);
assert.deepEqual(legacy.deleted, [owner._id]);

const rotationKey = {
  ...apiKey,
  _id: "rotation-api-key-id",
  revokedAt: undefined,
} as unknown as ApiKey;
const rotation = fakeDb({ sessions: [owner, child], apiKeys: [rotationKey] });
const resolvedRotation = await resolvePreviousCliCredentials(rotation.db, {
  sessionToken: owner.sessionToken,
  apiKey: rawApiKey,
});
assert.equal(resolvedRotation.ok, true);
if (resolvedRotation.ok) {
  assert.equal(resolvedRotation.session?._id, owner._id);
  assert.equal(resolvedRotation.apiKeyDoc?._id, rotationKey._id);
  await revokeResolvedCliCredentials(rotation.db, resolvedRotation, owner._id);
}
assert.deepEqual(rotation.patched, [rotationKey._id]);
assert.deepEqual(rotation.deleted, [child._id], "same-workspace force login rotates the owner row in place");

const otherWorkspaceKey = {
  ...rotationKey,
  _id: "other-workspace-api-key-id",
  workspaceId: "other-workspace-id",
  revokedAt: undefined,
} as unknown as ApiKey;
const corruptRotation = fakeDb({ sessions: [owner], apiKeys: [otherWorkspaceKey] });
assert.deepEqual(
  await resolvePreviousCliCredentials(corruptRotation.db, {
    sessionToken: owner.sessionToken,
    apiKey: rawApiKey,
  }),
  { ok: false, error: "previous_credentials_mismatch" },
  "a mismatched local credential pair fails before either workspace is mutated",
);
assert.deepEqual(corruptRotation.patched, []);
assert.deepEqual(corruptRotation.deleted, []);

const cliSource = readFileSync(
  fileURLToPath(new URL("../src/cli/commands/auth.ts", import.meta.url)),
  "utf8",
);
const logoutSource = cliSource.slice(
  cliSource.indexOf("export async function authLogoutCommand"),
  cliSource.indexOf("export async function authWhoamiCommand"),
);
assert.ok(
  logoutSource.indexOf("convexMutation<LogoutResult>('cliAuth:logout'") <
    logoutSource.indexOf("clearAuthConfig()"),
  "local credentials are cleared only after remote revocation succeeds",
);
assert.match(
  logoutSource,
  /catch \(error\)[\s\S]*?Local credentials were preserved[\s\S]*?throw error/,
  "network failures preserve the retry credential",
);

const loginSource = cliSource.slice(
  cliSource.indexOf("export async function authLoginCommand"),
  cliSource.indexOf("export async function authLogoutCommand"),
);
assert.match(
  loginSource,
  /options\.force && existing[\s\S]*?previousSessionToken: existing\.sessionToken[\s\S]*?previousApiKey: existing\.apiKey/,
  "force login sends the exact locally-held credentials for atomic replacement",
);
assert.ok(
  loginSource.indexOf("previousSessionToken: existing.sessionToken") <
    loginSource.indexOf("writeAuthConfig(cfg)"),
  "the old retry credentials remain on disk until exchange and rotation succeed",
);

const serverSource = readFileSync(fileURLToPath(new URL("./cliAuth.ts", import.meta.url)), "utf8");
const exchangeSource = serverSource.slice(
  serverSource.indexOf("export const _exchangeVerified"),
);
assert.ok(
  exchangeSource.indexOf("resolvePreviousCliCredentials") <
    exchangeSource.indexOf('status: "exchanged"'),
  "prior credentials are validated before the one-time code is consumed",
);
assert.ok(
  exchangeSource.indexOf("revokeResolvedCliCredentials") <
    exchangeSource.indexOf("const rawKey ="),
  "the exact prior key/session are revoked in the same transaction before replacement issuance",
);

console.log("CLI logout and force login atomically rotate remote bearers before local overwrite");
