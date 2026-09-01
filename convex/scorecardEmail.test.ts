#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  renderDailyScorecardHtml,
  renderDailyScorecardSubject,
  renderDailyScorecardText,
  windowFromQueries,
} from "./dailyScorecard";

const yesterday = {
  installs: 4,
  started: 3,
  loggedIn: 0,
  calls: 0,
};
const week = {
  installs: 12,
  started: 10,
  loggedIn: 5,
  calls: 2,
};

const leakBody = renderDailyScorecardText({ yesterday, week });
const leakSubject = renderDailyScorecardSubject(yesterday);
assert.equal(
  leakBody,
  [
    "Igår",
    "- Installerade: 4",
    "- Startade appen: 3",
    "- Loggade in: 0",
    "- Gjorde ett anrop: 0",
    "",
    "Senaste 7 dagarna",
    "- Installerade: 12",
    "- Startade appen: 10",
    "- Loggade in: 5",
    "- Gjorde ett anrop: 2",
    "",
    "Alla 3 som startade appen igår misslyckades med att logga in.",
  ].join("\n"),
);

assert.match(leakBody, /Installerade/);
assert.match(leakBody, /Startade appen/);
assert.match(leakBody, /Loggade in/);
assert.match(leakBody, /Gjorde ett anrop/);
assert.match(leakBody, /^Igår$/m);
assert.match(leakBody, /^Senaste 7 dagarna$/m);
assert.match(leakBody, /Installerade: 4/);
assert.match(leakBody, /Startade appen: 3/);
assert.match(leakBody, /Loggade in: 0/);
assert.match(leakBody, /Gjorde ett anrop: 0/);
assert.match(leakBody, /Installerade: 12/);
assert.match(leakBody, /Startade appen: 10/);
assert.match(leakBody, /Loggade in: 5/);
assert.match(leakBody, /Gjorde ett anrop: 2/);
assert.match(
  leakBody,
  /Alla 3 som startade appen igår misslyckades med att logga in/,
);
assert.equal(leakSubject, "APIClaw igår: 3 startade, 0 loggade in");

const loggedInBody = renderDailyScorecardText({
  yesterday: { installs: 4, started: 3, loggedIn: 2, calls: 1 },
  week,
});
assert.match(loggedInBody, /2 loggade in/);
assert.match(loggedInBody, /1 som startade appen loggade inte in/);
assert.match(loggedInBody, /Det är misslyckanden/);
assert.equal(
  renderDailyScorecardSubject({ installs: 4, started: 3, loggedIn: 2, calls: 1 }),
  "APIClaw igår: 3 startade, 2 loggade in",
);

const allInBody = renderDailyScorecardText({
  yesterday: { installs: 2, started: 2, loggedIn: 2, calls: 1 },
  week,
});
assert.match(allInBody, /Alla 2 som startade appen igår loggade in/);

const noneStarted = renderDailyScorecardText({
  yesterday: { installs: 0, started: 0, loggedIn: 0, calls: 0 },
  week: { installs: 1, started: 1, loggedIn: 1, calls: 0 },
});
assert.match(noneStarted, /Ingen startade appen igår/);

for (const sample of [leakBody, loggedInBody, allInBody, noneStarted, leakSubject]) {
  assert.doesNotMatch(sample, /Clerk/);
  assert.doesNotMatch(sample, /first_run/);
  assert.doesNotMatch(sample, /first_call/);
  assert.doesNotMatch(sample, /verify_code/);
  assert.doesNotMatch(sample, /activated owners/i);
  assert.doesNotMatch(sample, /activated/i);
  assert.doesNotMatch(sample, /funnel/i);
  assert.doesNotMatch(sample, /backfill/i);
  assert.doesNotMatch(sample, /scorecard/i);
  assert.doesNotMatch(sample, /<html|<table|<p |<div|<br/i);
  assert.doesNotMatch(sample, /<[a-zA-Z/][^>]*>/);
  assert.doesNotMatch(sample, /\$0\./);
  assert.doesNotMatch(sample, /🦞|lobster/i);
}

const leakHtml = renderDailyScorecardHtml({ yesterday, week }, Date.UTC(2026, 8, 1));
assert.match(leakHtml, /Installerade/);
assert.match(leakHtml, /Startade appen/);
assert.match(leakHtml, /Loggade in/);
assert.match(leakHtml, /Gjorde ett anrop/);
assert.match(
  leakHtml,
  /Alla 3 som startade appen igår misslyckades med att logga in/,
);
assert.match(leakHtml, /#ef4444/i);
assert.match(leakHtml, /Inter/);
assert.match(leakHtml, /JetBrains Mono/);
assert.match(leakHtml, /Igår/);
assert.match(leakHtml, /Senaste 7 dagarna/);
assert.match(leakHtml, /color:#6f6f78[^>]*>Igår/);
assert.match(leakHtml, /color:#6f6f78[^>]*>Senaste 7 dagarna/);
assert.match(leakHtml, /#111113/);
assert.match(leakHtml, /#151517/);
assert.match(leakHtml, /#0b0b0c/);
assert.match(leakHtml, /apiclaw\.cloud/);
assert.match(leakHtml, /2026-09-01/);
assert.match(leakHtml, /<table/i);
assert.doesNotMatch(leakHtml, /display\s*:\s*flex/i);
assert.doesNotMatch(leakHtml, /display\s*:\s*grid/i);
assert.doesNotMatch(leakHtml, /linear-gradient/i);
assert.doesNotMatch(leakHtml, /#58A6FF/i);
assert.doesNotMatch(leakHtml, /#161B22/i);
assert.doesNotMatch(leakHtml, /Control Plane/i);
assert.doesNotMatch(leakHtml, /#f87171|#dc2626/i);
assert.doesNotMatch(leakHtml, /Clerk/);
assert.doesNotMatch(leakHtml, /first_run/);
assert.doesNotMatch(leakHtml, /first_call/);
assert.doesNotMatch(leakHtml, /verify_code/);
assert.doesNotMatch(leakHtml, /activated owners/i);
assert.doesNotMatch(leakHtml, /activated/i);
assert.doesNotMatch(leakHtml, /funnel/i);
assert.doesNotMatch(leakHtml, /backfill/i);
assert.doesNotMatch(leakHtml, /\$0\./);
assert.doesNotMatch(leakHtml, /🦞|lobster/i);

const allInHtml = renderDailyScorecardHtml({
  yesterday: { installs: 2, started: 2, loggedIn: 2, calls: 1 },
  week,
});
assert.match(allInHtml, /Alla 2 som startade appen igår loggade in/);
assert.match(allInHtml, /#3ecf8e/);
assert.doesNotMatch(
  allInHtml,
  /#ef4444/i,
  "red is a failure signature, not chrome, when someone logged in",
);

const noneStartedHtml = renderDailyScorecardHtml({
  yesterday: { installs: 0, started: 0, loggedIn: 0, calls: 0 },
  week: { installs: 1, started: 1, loggedIn: 1, calls: 0 },
});
assert.match(noneStartedHtml, /Ingen startade appen igår/);

assert.equal(
  renderDailyScorecardText({ yesterday, week }),
  leakBody,
  "plaintext renderer must stay unchanged when HTML is added",
);

const mapped = windowFromQueries(
  {
    truth: {
      installs: 7,
      authenticatedWorkspaces: 2,
      activatedOwners: 99,
      activatedUsers: 1,
    },
  },
  {
    funnel: [
      { event: "install", unique: 7 },
      { event: "first_run", unique: 5 },
      { event: "workspace_authenticated", unique: 2 },
      { event: "first_call_api_success", unique: 1 },
    ],
  },
);
assert.deepEqual(mapped, {
  installs: 7,
  started: 5,
  loggedIn: 2,
  calls: 1,
});
assert.equal(
  renderDailyScorecardSubject(mapped),
  "APIClaw igår: 5 startade, 2 loggade in",
  "subject must use 24h start + login counts, not 7d or call counts",
);

const src = readFileSync(fileURLToPath(new URL("./scorecardEmail.ts", import.meta.url)), "utf8");
const daily = src.slice(src.indexOf("export const sendDailyScorecard"));
assert.match(daily, /hoursBack:\s*24/);
assert.match(daily, /hoursBack:\s*168/);
assert.match(daily, /classification:\s*"human"/);
assert.match(daily, /includeClassifications:\s*\["human"\]/);
assert.match(daily, /internal\.funnel\.getScorecard/);
assert.match(daily, /internal\.funnel\.getFunnel/);
assert.match(daily, /from:\s*EMAIL_FROM/);
assert.match(daily, /to:\s*RECIPIENT/);
assert.match(daily, /html,/);
assert.match(daily, /text,/);
assert.match(src, /renderDailyScorecardHtml/);
assert.match(daily, /if \(!apiKey\)/);
assert.match(daily, /sent:\s*false/);
assert.doesNotMatch(daily, /fetch\([\s\S]*process\.env/);

const crons = readFileSync(fileURLToPath(new URL("./crons.ts", import.meta.url)), "utf8");
assert.match(
  crons,
  /crons\.daily\(\s*"daily-scorecard-email",\s*\{\s*hourUTC:\s*7,\s*minuteUTC:\s*0/,
);
assert.match(crons, /internal\.scorecardEmail\.sendDailyScorecard/);
assert.doesNotMatch(crons, /"weekly-scorecard-email"/);
assert.doesNotMatch(crons, /sendWeeklyScorecard/);
assert.match(crons, /weekly-usage-report/);
assert.match(crons, /nurture-classify/);
assert.match(crons, /nurture-send/);

console.log("daily operator mail is APIClaw HTML + unchanged Swedish plaintext");
