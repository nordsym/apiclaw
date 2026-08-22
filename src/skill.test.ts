#!/usr/bin/env npx tsx
/**
 * Agent front door. An agent given
 * `set up https://apiclaw.cloud/SKILL.md` must be able to install, auth,
 * and land one POST /v1/execute without guessing. llms.txt and /api/catalog
 * already exist; SKILL.md is the operational door, not a second canon.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const SKILL_PATH = "landing/public/SKILL.md";
assert.equal(existsSync(SKILL_PATH), true, "SKILL.md must ship as a landing static file");
assert.equal(existsSync("landing/public/llms.txt"), true, "llms.txt remains identity/truth");
assert.equal(existsSync("landing/src/app/api/catalog/route.ts"), true, "/api/catalog remains the live count source");

const skill = readFileSync(SKILL_PATH, "utf8");
const homepage = readFileSync("landing/src/app/page.tsx", "utf8");
const hero = readFileSync("landing/src/components/HeroDoorsPreview.tsx", "utf8");
const llms = readFileSync("landing/public/llms.txt", "utf8");
const agents = readFileSync("landing/public/agents.md", "utf8");

assert.match(skill, /npx @nordsym\/apiclaw auth login/, "auth is Clerk via auth login");
assert.match(skill, /~\/\.apiclaw\.toml/, "existing toml session is enough");
assert.match(skill, /~\/\.apiclaw\/session/, "existing session file is enough");
assert.match(skill, /POST \/v1\/execute/, "execute is POST /v1/execute");
assert.match(skill, /nasa/, "first research call is NASA APOD");
assert.match(skill, /apod/, "first research call is NASA APOD");
assert.match(skill, /frankfurter/i, "Frankfurter /latest is the fallback");
assert.match(skill, /\/latest/, "Frankfurter fallback uses /latest");
assert.match(skill, /auth first-call/, "first-call command is the preferred path");
assert.match(skill, /1,?025/, "callable count is the live catalog card count");
assert.match(skill, /26,?619/, "discoverable count is canon");
assert.match(skill, /22 managed adapters/, "adapter inventory is canon");
assert.match(skill, /Do not invent metrics/);
assert.match(skill, /Never ask the user to paste|Do not ask the user to paste a token/i);
assert.doesNotMatch(skill, /paste (?:an? )?(?:API )?key/i);
assert.doesNotMatch(skill, /app\.monid\.ai|monid setup|@monid-ai\/cli/);
assert.doesNotMatch(skill, /apiclaw call CoinGecko/);
assert.doesNotMatch(skill, /\/v1\/call(?!`)/);
assert.doesNotMatch(skill, /twilio|resend|46elks|together/i);
assert.doesNotMatch(skill, /npm i -g @nordsym\/apiclaw/, "do not require a global install");

assert.match(homepage, /set up https:\/\/apiclaw\.cloud\/SKILL\.md/, "homepage shows the agent one-liner");
assert.match(homepage, /Give this to your agent/);
assert.match(homepage, /curl -fsSL https:\/\/apiclaw\.cloud\/install\.sh \| bash/, "curl|bash stays a first-class door");
assert.match(homepage, /npx @nordsym\/apiclaw auth login/, "CLI auth stays a first-class door");
assert.match(homepage, /label: "Callable now"/, "headline metric is callable, not installs");
assert.match(homepage, /label: "Managed adapters"/);
assert.doesNotMatch(homepage, /label: "npm installs"/, "installs are not the metric that matters");

assert.match(hero, /set up https:\/\/apiclaw\.cloud\/SKILL\.md/, "hero doors show the skill one-liner");
assert.match(hero, /nasa/);
assert.match(hero, /apod/);
assert.match(hero, /v1\/execute/);

assert.match(llms, /https:\/\/apiclaw\.cloud\/SKILL\.md/, "llms.txt points at the skill door");
assert.match(agents, /https:\/\/apiclaw\.cloud\/SKILL\.md/, "agents.md points at the skill door");
assert.match(llms, /Agent front door/);
assert.match(llms, /operational[\s\S]{0,16}(?:canon|door)/i);

console.log("skill: SKILL.md is the agent front door; homepage shows the one-liner; execute is /v1/execute");
