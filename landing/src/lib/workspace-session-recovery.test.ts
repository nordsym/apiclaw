#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import {
  getWorkspaceSessionToken,
  recoverWorkspaceSessionToken,
  subscribeWorkspaceSessionToken,
} from "./workspace-session";

const originalFetch = globalThis.fetch;
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const originalNow = Date.now;
let now = Date.UTC(2026, 8, 11, 20);
let fetchCalls = 0;
let serial = 0;
let timerId = 0;
const timers = new Map<number, () => void>();
const events = new Map<string, Set<() => void>>();
const published: (string | null)[] = [];
const token = () => `apiclaw_browser_synthetic_${++serial}_abcdefghijklmnop`;
let nextToken = token();
let response: () => Promise<Response> = async () => new Response(JSON.stringify({
  browserToken: nextToken,
  browserExpiresAt: now + 15 * 60_000,
}));

Object.defineProperty(globalThis, "window", { configurable: true, value: {
  localStorage: { getItem: () => null, removeItem: () => {} },
  setTimeout: (callback: () => void) => { timers.set(++timerId, callback); return timerId; },
  clearTimeout: (id: number) => { timers.delete(id); },
  addEventListener: (name: string, callback: () => void) => {
    if (!events.has(name)) events.set(name, new Set());
    events.get(name)!.add(callback);
  },
} });
Date.now = () => now;
globalThis.fetch = async (url, init) => {
  assert.equal(url, "/api/workspace-auth/session");
  assert.equal(init?.credentials, "same-origin");
  assert.equal(init?.method, "GET");
  fetchCalls++;
  return response();
};
const unsubscribe = subscribeWorkspaceSessionToken((value) => published.push(value));
const flush = async () => { for (let n = 0; n < 12; n++) await Promise.resolve(); };

async function main() {
try {
  const first = await getWorkspaceSessionToken();
  assert.equal(first, nextToken);
  assert.equal(events.get("focus")?.size, 1);
  assert.equal(events.get("pageshow")?.size, 1);

  nextToken = token();
  assert.equal(await recoverWorkspaceSessionToken(first!), nextToken, "rejected unexpired child is renewed");
  assert.equal(published.at(-1), nextToken, "renewal reaches subscribers");
  assert.equal(published.includes(null), false, "successful recovery does not publish transient logout");
  const beforeReuse = fetchCalls;
  assert.equal(await recoverWorkspaceSessionToken(first!), nextToken, "stale rejection reuses newer valid child");
  assert.equal(fetchCalls, beforeReuse);

  const previous = nextToken;
  nextToken = token();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const successResponse = response;
  response = async () => { await gate; return successResponse(); };
  const beforeConcurrent = fetchCalls;
  now += 14 * 60_000;
  events.get("focus")!.forEach((callback) => callback());
  const recoveryA = recoverWorkspaceSessionToken(previous);
  const recoveryB = recoverWorkspaceSessionToken(previous);
  assert.equal(fetchCalls, beforeConcurrent + 1, "focus renewal and concurrent failures share one owner refresh");
  release();
  assert.deepEqual(await Promise.all([recoveryA, recoveryB]), [nextToken, nextToken]);
  response = successResponse;

  now += 16 * 60_000;
  const expired = nextToken;
  nextToken = token();
  assert.equal(await recoverWorkspaceSessionToken(expired), nextToken, "expired child renews through owner cookie");

  const beforeResume = fetchCalls;
  events.get("focus")!.forEach((callback) => callback());
  assert.equal(fetchCalls, beforeResume, "healthy session does not rotate on every focus");
  now += 14 * 60_000;
  nextToken = token();
  events.get("focus")!.forEach((callback) => callback());
  await flush();
  assert.equal(published.at(-1), nextToken, "near-expiry focus resumes renewal");
  now += 16 * 60_000;
  nextToken = token();
  events.get("pageshow")!.forEach((callback) => callback());
  await flush();
  assert.equal(published.at(-1), nextToken, "expired pageshow resumes renewal");
  assert.equal(events.get("focus")?.size, 1, "rotations do not accumulate event listeners");
  assert.equal(events.get("pageshow")?.size, 1);

  response = async () => new Response(JSON.stringify({ session: null }));
  assert.equal(await recoverWorkspaceSessionToken(nextToken), null, "invalid owner cannot restore rejected child");
  assert.equal(published.at(-1), null);
  assert.equal(timers.size, 0, "failed recovery cannot retry stale child indefinitely");

  response = successResponse;
  nextToken = token();
  assert.equal(await getWorkspaceSessionToken(), nextToken);
  response = async () => { throw new Error("synthetic network failure"); };
  assert.equal(await recoverWorkspaceSessionToken(nextToken), null, "transport failure cannot return rejected unexpired child");
  assert.equal(published.at(-1), null);
} finally {
  unsubscribe();
  globalThis.fetch = originalFetch;
  Date.now = originalNow;
  if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
  else delete (globalThis as any).window;
}

console.log("Workspace child recovery renews rejected/expired tokens, deduplicates requests, resumes safely, and never restores rejected tokens");

}
void main().catch((error) => { console.error(error); process.exitCode = 1; });
