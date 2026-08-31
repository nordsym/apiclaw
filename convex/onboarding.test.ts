#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const source = readFileSync(fileURLToPath(new URL("./onboarding.ts", import.meta.url)), "utf8");

const getState = source.slice(
  source.indexOf("export const getState"),
  source.indexOf("export const setSource"),
);
assert.match(getState, /firstCallAt/);
assert.match(
  getState,
  /withIndex\("by_dedupeKey"[\s\S]*first_call:\$\{ws\._id\}/,
  "getState must expose the existing first_call funnel row so the wizard can poll",
);
assert.match(getState, /firstCall\?\.timestamp \?\? null/);
assert.doesNotMatch(getState, /brave_search/);

console.log("onboarding getState exposes firstCallAt from the first_call funnel row");
