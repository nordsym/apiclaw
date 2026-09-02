import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  AGENT_FIRST_CALL_PROMPT,
  BROWSER_FIRST_EXECUTE_RAILS,
  CLI_ARRIVAL_LINE,
  CLI_CALL,
  WORKSPACE_AFTER_CLI_AUTH,
  ONBOARDING_OVERLAY_CLASS,
  WAITING_FOR_FIRST_CALL,
  decideOnboardingGate,
  formatOnboardingExecuteResult,
  httpFirstCallCurl,
  isOnboardingExecuteSuccess,
  UNKNOWN_ONBOARDING_STATE,
} from "./onboarding-first-call";

assert.equal(
  decideOnboardingGate(null),
  "open",
  "unknown getState must fail-open so a new Clerk user cannot wander",
);
assert.equal(decideOnboardingGate(UNKNOWN_ONBOARDING_STATE), "open");
assert.equal(decideOnboardingGate({ completedAt: 1, dismissedAt: null, firstCallAt: null }), "closed");
assert.equal(decideOnboardingGate({ completedAt: 1, dismissedAt: 2, firstCallAt: 3 }), "closed");
assert.equal(
  decideOnboardingGate({ completedAt: null, dismissedAt: null, firstCallAt: 1 }),
  "complete",
  "first_call already landed must auto-complete, not trap",
);
assert.equal(
  decideOnboardingGate({ completedAt: null, dismissedAt: 1, firstCallAt: 2 }),
  "complete",
  "first_call wins over a prior dismiss",
);
assert.equal(decideOnboardingGate({ completedAt: null, dismissedAt: 1, firstCallAt: null }), "resume");
assert.equal(decideOnboardingGate({ completedAt: null, dismissedAt: null, firstCallAt: null }), "open");

assert.match(ONBOARDING_OVERLAY_CLASS, /backdrop-blur-2xl/);
assert.match(ONBOARDING_OVERLAY_CLASS, /bg-white\/10/);
assert.match(ONBOARDING_OVERLAY_CLASS, /backdrop-saturate-150/);
assert.doesNotMatch(ONBOARDING_OVERLAY_CLASS, /bg-black\/70/);

assert.equal(WAITING_FOR_FIRST_CALL, "Waiting for your first tool call");
assert.doesNotMatch(WAITING_FOR_FIRST_CALL, /—|–/);

assert.equal(WORKSPACE_AFTER_CLI_AUTH, "/workspace?from=cli");
const donePage = readFileSync(new URL("../app/auth/cli/done/page.tsx", import.meta.url), "utf8");
assert.match(donePage, /Go back to that chat and retry/);
assert.doesNotMatch(
  donePage,
  /claw-btn-solid[\s\S]{0,80}Open workspace|Open workspace[\s\S]{0,80}claw-btn-solid/,
  "/auth/cli/done must not send the human into workspace as the solid next step",
);
assert.match(CLI_ARRIVAL_LINE, /whoami/);
assert.match(CLI_ARRIVAL_LINE, /NASA APOD/);
assert.match(CLI_ARRIVAL_LINE, /Your agent just signed in/);
assert.doesNotMatch(CLI_ARRIVAL_LINE, /—|–/);
assert.doesNotMatch(CLI_ARRIVAL_LINE, /terminal/i, "CLI arrival must not sound like a waiting terminal");

// Arriving from /auth/cli/done must open the wizard on the agent launch
// step (waiting for the first call), not the door chooser.
const workspacePage = readFileSync(new URL("../app/workspace/page.tsx", import.meta.url), "utf8");
assert.match(workspacePage, /searchParams\.get\("from"\) === "cli"/);
assert.match(workspacePage, /<OnboardingWizard sessionToken=\{sessionToken\} arrival=\{arrival\} \/>/);
const wizardArrival = readFileSync(new URL("../components/OnboardingWizard.tsx", import.meta.url), "utf8");
assert.match(wizardArrival, /if \(arrival === "cli"\) \{\s*\/\/[^\n]*\n\s*\/\/[^\n]*\n\s*setDoor\("agent"\);\s*setView\("launch"\);/);
assert.match(wizardArrival, /arrival === "cli"\s*\? CLI_ARRIVAL_LINE/);

assert.match(AGENT_FIRST_CALL_PROMPT, /apiclaw\.cloud\/SKILL\.md/);
assert.match(AGENT_FIRST_CALL_PROMPT, /install\.sh|npx @nordsym\/apiclaw@latest/);
assert.match(AGENT_FIRST_CALL_PROMPT, /whoami/);
assert.match(AGENT_FIRST_CALL_PROMPT, /nasa/);
assert.match(AGENT_FIRST_CALL_PROMPT, /apod/);
assert.match(AGENT_FIRST_CALL_PROMPT, /frankfurter/);
assert.match(AGENT_FIRST_CALL_PROMPT, /Do not paste a token/);
assert.match(AGENT_FIRST_CALL_PROMPT, /Do not add a card/);
assert.doesNotMatch(AGENT_FIRST_CALL_PROMPT, /brave_search/);
assert.doesNotMatch(AGENT_FIRST_CALL_PROMPT, /provider "brave/);

assert.match(CLI_CALL, /nasa\/apod/);
assert.doesNotMatch(CLI_CALL, /brave_search/);

const curl = httpFirstCallCurl("sk-claw-test");
assert.match(curl, /\/v1\/execute/);
assert.match(curl, /"provider":"nasa"/);
assert.match(curl, /"action":"apod"/);
assert.doesNotMatch(curl, /brave_search/);

assert.deepEqual(
  BROWSER_FIRST_EXECUTE_RAILS.map((rail) => rail.provider),
  ["nasa", "frankfurter"],
);
assert.equal(
  BROWSER_FIRST_EXECUTE_RAILS.some((rail) =>
    ["brave_search", "serper", "firecrawl"].includes(rail.provider),
  ),
  false,
);

assert.equal(isOnboardingExecuteSuccess(200, { success: true }), true);
assert.equal(isOnboardingExecuteSuccess(200, { success: false }), false);
assert.equal(isOnboardingExecuteSuccess(402, { success: true }), false);
assert.equal(
  formatOnboardingExecuteResult("nasa", { data: { title: "Helix Nebula" } }),
  "NASA APOD: Helix Nebula",
);
assert.equal(
  formatOnboardingExecuteResult("frankfurter", { rates: { USD: 1.17 } }),
  "EUR/USD 1.17",
);

const wizard = readFileSync(new URL("../components/OnboardingWizard.tsx", import.meta.url), "utf8");
assert.match(wizard, /ONBOARDING_OVERLAY_CLASS/);
assert.match(wizard, /createPortal/);
assert.match(wizard, /document\.body/);
assert.match(wizard, /WAITING_FOR_FIRST_CALL|Waiting for your first tool call/);
assert.match(wizard, /AGENT_FIRST_CALL_PROMPT/);
assert.match(wizard, /Send this to your agent/);
assert.match(wizard, /Cursor/);
assert.match(wizard, /Codex/);
assert.match(wizard, /Claude Code/);
assert.match(wizard, /ChatGPT/);
assert.match(wizard, /Grok/);
assert.match(wizard, /Other MCP/);
assert.match(wizard, /Later/);
assert.match(wizard, /onboarding:dismiss/);
assert.match(wizard, /decideOnboardingGate/);
assert.match(wizard, /UNKNOWN_ONBOARDING_STATE/);
assert.match(
  wizard,
  /next \?\? UNKNOWN_ONBOARDING_STATE/,
  "getState failure must fail-open, not keep the wizard closed",
);
assert.match(wizard, /gate === "complete"/);
assert.match(wizard, /firstCallAt/);
assert.match(
  wizard,
  /view === "launch" && door === "agent"[\s\S]*Send this to your agent[\s\S]*AGENT_FIRST_CALL_PROMPT[\s\S]*WAITING_FOR_FIRST_CALL/,
  "agent prompt must appear on the waiting step, before any browser call",
);
assert.match(
  wizard,
  /door === "agent"/,
  "agent door must be gated so the browser does not POST the first execute",
);
assert.doesNotMatch(wizard, /provider:\s*"brave_search"|brave_search\/search/);
assert.doesNotMatch(wizard, /What do you want to try first/);
assert.doesNotMatch(wizard, /I already have a prompt in mind/);

console.log("onboarding first-call: frost overlay, SKILL.md NASA prompt, wait/auto-complete, skip stays quiet");
