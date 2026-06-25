#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { getHourStart, getQuotaState, getWeekStart } from "./quota";

const now = Date.UTC(2026, 5, 25, 15, 30, 0);
const currentWeek = getWeekStart(now);
const currentHour = getHourStart(now);

const capped = getQuotaState({
  tier: "free",
  weeklyUsageCount: 50,
  hourlyUsageCount: 1,
  lastWeeklyResetAt: currentWeek,
  lastHourlyResetAt: currentHour,
}, 1, now);
assert.equal(capped.allowed, false);
assert.equal(capped.reason, "weekly_quota_exceeded");

const hourlyCapped = getQuotaState({
  tier: "free",
  weeklyUsageCount: 4,
  hourlyUsageCount: 10,
  lastWeeklyResetAt: currentWeek,
  lastHourlyResetAt: currentHour,
}, 1, now);
assert.equal(hourlyCapped.allowed, false);
assert.equal(hourlyCapped.reason, "hourly_quota_exceeded");

const paid = getQuotaState({
  tier: "usage_based",
  weeklyUsageCount: 5000,
  hourlyUsageCount: 100,
  lastWeeklyResetAt: currentWeek,
  lastHourlyResetAt: currentHour,
}, 1, now);
assert.equal(paid.allowed, true);
assert.equal(paid.weeklyLimit, -1);

const reset = getQuotaState({
  tier: "free",
  weeklyUsageCount: 50,
  hourlyUsageCount: 10,
  lastWeeklyResetAt: currentWeek - 8 * 24 * 3600000,
  lastHourlyResetAt: currentHour - 2 * 3600000,
}, 1, now);
assert.equal(reset.allowed, true);
assert.equal(reset.weeklyCount, 0);
assert.equal(reset.hourlyCount, 0);

console.log("convex quota guard: synthetic capped free workspace blocks before call");
