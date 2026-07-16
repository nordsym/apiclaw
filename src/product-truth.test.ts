import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FREE_MANAGED_CALLS_PER_WEEK, nextWeeklyResetUtc } from "./product-truth.js";

assert.equal(FREE_MANAGED_CALLS_PER_WEEK, 50);
assert.match(
  readFileSync("convex/quota.ts", "utf8"),
  new RegExp(`FREE_WEEKLY_LIMIT = ${FREE_MANAGED_CALLS_PER_WEEK}\\b`),
);
assert.equal(
  nextWeeklyResetUtc(Date.UTC(2026, 6, 16, 12, 0, 0)),
  "2026-07-20 00:00 UTC",
);
assert.equal(
  nextWeeklyResetUtc(Date.UTC(2026, 6, 20, 0, 0, 0)),
  "2026-07-27 00:00 UTC",
);

const activeTruthSurfaces = [
  "README.md",
  "src/index.ts",
  "convex/http.ts",
  "convex/email.ts",
  "convex/nurture.ts",
  "convex/postVerifyNudge.ts",
  "landing/src/lib/plans.ts",
  "landing/src/app/page.tsx",
  "landing/src/app/workspace/page.tsx",
  "landing/src/components/CheckoutButton.tsx",
];

for (const file of activeTruthSurfaces) {
  const content = readFileSync(file, "utf8");
  assert.doesNotMatch(
    content,
    /25 (?:free )?(?:managed |API )?calls(?: per month|\/month)|monthly free tier|Free tier: 50 API calls\b|free API calls this month|\$0\.002\/call|unlock unlimited usage/i,
    `${file} contains stale free-tier truth`,
  );
}

const planCopy = readFileSync("landing/src/lib/plans.ts", "utf8");
assert.match(planCopy, /calls: "50"/);
assert.match(planCopy, /callsSub: "managed calls per week"/);

console.log("product truth: public copy matches the enforced 50 managed calls per week");
