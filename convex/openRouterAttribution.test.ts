#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { decorateOpenRouterRequest, openRouterWorkspacePseudonym } from "./openRouterAttribution";

const workspaceA = "workspace_secret_a";
const workspaceB = "workspace_secret_b";
const secret = "unit-test-pseudonym-key";
const first = await openRouterWorkspacePseudonym(workspaceA, secret);
const second = await openRouterWorkspacePseudonym(workspaceA, secret);
const other = await openRouterWorkspacePseudonym(workspaceB, secret);

assert.equal(first, second);
assert.notEqual(first, other);
assert.doesNotMatch(first, /workspace_secret/);

const decorated = await decorateOpenRouterRequest({ model: "test", user: "caller-controlled" }, workspaceA, secret);
assert.equal(decorated.user, first);
assert.doesNotMatch(JSON.stringify(decorated), new RegExp(workspaceA));

console.log("OpenRouter attribution: stable pseudonyms replace caller-controlled user IDs");
