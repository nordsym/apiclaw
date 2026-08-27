#!/usr/bin/env npx tsx
/**
 * Agent front door. An agent given
 * `set up https://apiclaw.cloud/SKILL.md` must be able to install, auth,
 * and land one POST /v1/execute without guessing. llms.txt and /api/catalog
 * already exist; SKILL.md is the operational door, not a second canon.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SKILL_PATH = "landing/public/SKILL.md";
assert.equal(existsSync(SKILL_PATH), true, "SKILL.md must ship as a landing static file");
assert.equal(existsSync("landing/public/llms.txt"), true, "llms.txt remains identity/truth");
assert.equal(existsSync("landing/src/app/api/catalog/route.ts"), true, "/api/catalog remains the live count source");

const skill = readFileSync(SKILL_PATH, "utf8");
// Homepage design reset (2026-08-23, a819b6d/891f444/66ccb17) split page.tsx
// into landing/src/components/home/*; HeroDoorsPreview.tsx no longer exists,
// its content moved into Hero.tsx and Connect.tsx. Read the composed tree.
const HOME_DIR = "landing/src/components/home";
const homeFiles = [
  "landing/src/app/page.tsx",
  `${HOME_DIR}/Hero.tsx`,
  `${HOME_DIR}/Connect.tsx`,
  `${HOME_DIR}/Loop.tsx`,
  `${HOME_DIR}/Proof.tsx`,
  `${HOME_DIR}/Owners.tsx`,
  `${HOME_DIR}/Faq.tsx`,
  `${HOME_DIR}/SiteHeader.tsx`,
  `${HOME_DIR}/SiteFooter.tsx`,
  `${HOME_DIR}/truth.ts`,
];
const homepage = homeFiles.map((f) => readFileSync(f, "utf8")).join("\n");
const hero = readFileSync(`${HOME_DIR}/Hero.tsx`, "utf8") + readFileSync(`${HOME_DIR}/truth.ts`, "utf8");
const llms = readFileSync("landing/public/llms.txt", "utf8");
const agents = readFileSync("landing/public/agents.md", "utf8");
const httpAuth = readFileSync("convex/http.ts", "utf8");
const cliDirect = readFileSync("src/cli/commands/direct.ts", "utf8");
const cliHelp = readFileSync("src/cli/index.ts", "utf8");
// Polish pass (2026-08-23): the public homepage/catalog show only "discoverable"
// and "callable now" to avoid an unexplained internal metric; the adapter count
// and source-verified count moved to /docs's "Catalog numbers" block.
const docsPage = readFileSync("landing/src/app/docs/page.tsx", "utf8");

assert.match(skill, /npx @nordsym\/apiclaw auth login/, "auth is Clerk via auth login");
assert.match(skill, /npx @nordsym\/apiclaw auth whoami/, "whoami is the execute gate");
assert.match(skill, /~\/\.apiclaw\.toml/, "existing toml session is enough");
assert.match(skill, /~\/\.apiclaw\/session/, "existing session file is enough");
assert.match(skill, /session_token/, "login writes session_token");
assert.match(skill, /X-APIClaw-Session/, "execute sends X-APIClaw-Session");
assert.match(skill, /Do not send an empty `X-APIClaw-Session`/);
assert.match(skill, /Show the human the login URL/);
assert.match(skill, /Keep `auth login` in the foreground/);
assert.match(skill, /not success/);
assert.match(skill, /every few seconds/);
assert.match(skill, /[Ll]oop whoami/);
assert.match(skill, /each miss/i);
assert.match(skill, /Do not stop after one miss/);
assert.match(skill, /Only after whoami prints an email, execute NASA APOD/);
assert.match(skill, /Do not POST \/v1\/execute with an empty X-APIClaw-Session/);

const whoamiGate = skill.indexOf("npx @nordsym/apiclaw auth whoami");
const executeCurl = skill.indexOf("curl -sS https://api.apiclaw.cloud/v1/execute");
assert.ok(whoamiGate >= 0, "SKILL.md must tell agents to run whoami");
assert.ok(executeCurl > whoamiGate, "SKILL.md must order whoami before the execute curl");
assert.match(
  skill,
  /session_token\\s\*=\\s\*"\(\[\^"\]\+\)"/,
  "curl extracts session_token from ~/.apiclaw.toml",
);
assert.match(
  skill,
  /npx @nordsym\/apiclaw call nasa\/apod --params '\{\}' --idempotency-key/,
  "CLI slash form uses the same login session",
);
assert.doesNotMatch(
  skill,
  /writes `~\/\.apiclaw\.toml` with `api_key`/,
  "login must not be documented as writing api_key for execute",
);
assert.doesNotMatch(
  skill,
  /Equivalent: `Authorization: Bearer \$APICLAW_API_KEY`/,
  "first execute must not swap in Bearer api_key",
);
assert.match(skill, /POST \/v1\/execute/, "execute is POST /v1/execute");
assert.match(skill, /nasa/, "first research call is NASA APOD");
assert.match(skill, /apod/, "first research call is NASA APOD");
assert.match(skill, /frankfurter/i, "Frankfurter /latest is the fallback");
assert.match(skill, /\/latest/, "Frankfurter fallback uses /latest");
assert.match(skill, /api\.apiclaw\.cloud\/v1\/execute/, "first execute is the public gateway");
assert.match(skill, /1,?025/, "callable count is the live catalog card count");
assert.match(skill, /26,?619/, "discoverable count is canon");
assert.match(skill, /22 built-in providers/, "built-in provider inventory is canon");
assert.match(skill, /Do not invent metrics/);
assert.match(skill, /Never ask the user to paste|Do not ask the user to paste a token/i);
assert.doesNotMatch(skill, /paste (?:an? )?(?:API )?key/i);
assert.doesNotMatch(skill, /app\.monid\.ai|monid setup|@monid-ai\/cli/);
assert.doesNotMatch(skill, /apiclaw call CoinGecko/);
assert.doesNotMatch(skill, /\/v1\/call(?!`)/);
assert.doesNotMatch(skill, /twilio|resend|46elks|together/i);
assert.doesNotMatch(skill, /npm i -g @nordsym\/apiclaw/, "do not require a global install");

assert.match(homepage, /set up https:\/\/apiclaw\.cloud\/SKILL\.md/, "homepage shows the agent one-liner");
// The "Give this to your agent" section eyebrow was cut in the quiet-console
// reset; Hero.tsx now carries the same directive as body copy.
assert.match(homepage, /Paste one line to your agent/);
assert.match(homepage, /curl -fsSL https:\/\/apiclaw\.cloud\/install\.sh \| bash/, "curl|bash stays a first-class door");
assert.match(homepage, /npx @nordsym\/apiclaw auth login/, "CLI auth stays a first-class door");
assert.match(homepage, /label: "callable now"/, "headline metric is callable, not installs");
assert.doesNotMatch(homepage, /label: "managed adapters"/, "adapter count moved off the public homepage to /docs");
assert.match(docsPage, /built-in providers/, "built-in provider inventory stays canon on /docs");
assert.doesNotMatch(homepage, /label: "npm installs"/, "installs are not the metric that matters");

assert.match(hero, /set up https:\/\/apiclaw\.cloud\/SKILL\.md/, "hero doors show the skill one-liner");
assert.match(hero, /nasa/);
assert.match(hero, /apod/);
assert.match(hero, /v1\/execute/);

assert.match(llms, /https:\/\/apiclaw\.cloud\/SKILL\.md/, "llms.txt points at the skill door");
assert.match(agents, /https:\/\/apiclaw\.cloud\/SKILL\.md/, "agents.md points at the skill door");
assert.match(llms, /Agent front door/);
assert.match(llms, /operational[\s\S]{0,16}(?:canon|door)/i);
assert.match(llms, /X-APIClaw-Session: <session_token from ~\/\.apiclaw\.toml>/);
assert.match(agents, /X-APIClaw-Session: <session_token from ~\/\.apiclaw\.toml>/);
assert.match(httpAuth, /X-APIClaw-Session from session_token in ~\/\.apiclaw\.toml/);
assert.match(httpAuth, /auth whoami/);
assert.match(httpAuth, /Do not POST with an empty session header/);
assert.doesNotMatch(
  httpAuth,
  /pass your sk-claw-\.\.\. key as Authorization: Bearer/,
  "401 must not send post-login agents to Bearer api_key",
);
assert.match(cliDirect, /resolveExecuteAuthHeaders/);
assert.match(cliDirect, /UnsignedExecuteError/);
assert.match(cliHelp, /writes? session_token to ~\/\.apiclaw\.toml/);
assert.match(cliHelp, /stay in front until Clerk writes session_token/);
assert.match(cliHelp, /session_token from ~\/\.apiclaw\.toml as X-APIClaw-Session/);
assert.match(cliHelp, /Refuses locally until auth whoami succeeds/);

const extractMatch = skill.match(
  /node -e '([^']+)'/,
);
assert.ok(extractMatch, "SKILL.md must ship a session_token extract one-liner");
const emptyHome = mkdtempSync(join(tmpdir(), "apiclaw-skill-extract-"));
const extract = spawnSync(process.execPath, ["-e", extractMatch[1]], {
  env: { ...process.env, HOME: emptyHome, USERPROFILE: emptyHome },
  encoding: "utf8",
});
assert.notEqual(extract.status, 0, "SKILL.md extract must fail closed with no ~/.apiclaw.toml");
assert.equal(extract.stdout, "", "unsigned extract must not print an empty session token");
rmSync(emptyHome, { recursive: true, force: true });

console.log("skill: SKILL.md is the agent front door; homepage shows the one-liner; execute is /v1/execute");
