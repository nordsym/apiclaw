#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import * as chains from "./chains";

type ExportedFunction = {
  _handler: (ctx: unknown, args: unknown) => Promise<unknown>;
  exportArgs: () => string;
  isAction?: boolean;
  isInternal?: boolean;
  isPublic?: boolean;
};

const chainExports = chains as unknown as Record<string, ExportedFunction>;
const exportedFunctions = Object.entries(chainExports)
  .filter(([, value]) => typeof value === "function");

const publicExports = exportedFunctions
  .filter(([, value]) => value.isPublic)
  .map(([name]) => name)
  .sort();

assert.deepEqual(publicExports, [
  "getChainExecutions",
  "getChainStatsAuth",
  "getChainTraceAuth",
  "getInboundAPIActivity",
  "resumeChainAuth",
]);

const internalExports = exportedFunctions
  .filter(([, value]) => value.isInternal)
  .map(([name]) => name)
  .sort();
assert.deepEqual(internalExports, [
  "advanceChain",
  "completeChain",
  "completeStep",
  "createChainInternal",
  "executeStep",
  "failChain",
  "runChain",
  "runParallelSteps",
]);
assert.equal(
  exportedFunctions.length,
  publicExports.length + internalExports.length,
  "every exported chain function must be explicitly public or internal",
);

for (const [name, value] of exportedFunctions.filter(([, candidate]) => candidate.isPublic)) {
  const args = JSON.parse(value.exportArgs()) as {
    value: Record<string, { optional: boolean }>;
  };
  assert.equal(args.value.token?.optional, false, `${name} must require a session token`);
  assert.equal(
    Object.prototype.hasOwnProperty.call(args.value, "workspaceId"),
    false,
    `${name} must derive workspace ownership from the session`,
  );
}

assert.equal(chainExports.runChain.isInternal, true);
assert.equal(chainExports.runChain.isAction, true);

const removedUnauthenticatedExports = [
  "createChain",
  "createChainFromTemplate",
  "resumeChain",
  "pauseChain",
  "saveChainTemplate",
  "deleteChainTemplate",
  "getChain",
  "getChainTrace",
  "listChains",
  "listChainTemplates",
  "getChainTemplate",
  "getChainStats",
];
for (const name of removedUnauthenticatedExports) {
  assert.equal(
    Object.prototype.hasOwnProperty.call(chains, name),
    false,
    `${name} must not remain callable without tenant authentication`,
  );
}

const workspaceA = "workspace-a";
const workspaceB = "workspace-b";
const session = {
  _id: "session-a",
  _creationTime: 1,
  workspaceId: workspaceA,
  sessionToken: "session-token-a",
  sessionKind: "owner",
  createdAt: 1,
  lastUsedAt: 1,
};
const foreignChain = {
  _id: "chain-b",
  _creationTime: 1,
  workspaceId: workspaceB,
  steps: [],
  status: "failed",
  currentStep: 0,
  results: {},
  canResume: true,
  createdAt: 1,
};

const patches: unknown[] = [];
const foreignDb = {
  query(table: string) {
    assert.equal(table, "agentSessions");
    return {
      withIndex(_index: string, select: (query: { eq: (field: string, value: string) => unknown }) => unknown) {
        select({
          eq(field: string, value: string) {
            assert.equal(field, "sessionToken");
            assert.equal(value, session.sessionToken);
            return {};
          },
        });
        return { first: async () => session };
      },
    };
  },
  async get(id: string) {
    assert.equal(id, foreignChain._id);
    return foreignChain;
  },
  async patch(...args: unknown[]) {
    patches.push(args);
  },
};

const foreignResume = await chainExports.resumeChainAuth._handler(
  { db: foreignDb },
  { token: session.sessionToken, chainId: foreignChain._id },
);
assert.deepEqual(foreignResume, { error: "Chain not found" });
assert.equal(patches.length, 0, "a tenant must never mutate another workspace's chain");

const foreignTrace = await chainExports.getChainTraceAuth._handler(
  { db: foreignDb },
  { token: session.sessionToken, chainId: foreignChain._id },
);
assert.deepEqual(foreignTrace, { error: "Chain not found" });

const selectedWorkspaces: string[] = [];
const listDb = {
  query(table: string) {
    if (table === "agentSessions") {
      return {
        withIndex(_index: string, select: (query: { eq: (field: string, value: string) => unknown }) => unknown) {
          select({ eq: () => ({}) });
          return { first: async () => session };
        },
      };
    }
    assert.equal(table, "chains");
    return {
      withIndex(_index: string, select: (query: { eq: (field: string, value: string) => unknown }) => unknown) {
        select({
          eq(field: string, value: string) {
            assert.equal(field, "workspaceId");
            selectedWorkspaces.push(value);
            return {};
          },
        });
        return {
          order: () => ({ collect: async () => [] }),
        };
      },
    };
  },
};

const executions = await chainExports.getChainExecutions._handler(
  { db: listDb },
  { token: session.sessionToken, limit: 10 },
);
assert.deepEqual(executions, []);
assert.deepEqual(
  selectedWorkspaces,
  [workspaceA],
  "chain listings must use only the authenticated session workspace",
);

console.log("chain APIs expose only session-scoped customer reads and writes");
