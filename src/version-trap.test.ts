#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = [
  "install.sh",
  "landing/public/install.sh",
  "landing/public/install.ps1",
  "convex/http.ts",
  "convex/httpTrust.ts",
  "landing/src/app/install/page.tsx",
  "landing/src/components/InstallSection.tsx",
  "landing/src/components/HeroTabs.tsx",
  "landing/public/agents.md",
  "landing/public/SKILL.md",
];

for (const file of files) {
  const source = readFileSync(file, "utf8");
  assert.doesNotMatch(
    source,
    /@nordsym\/apiclaw@2\.8\.7/,
    `${file} must not pin unpublished 2.8.7 (npm 404). Published latest is 2.8.6 and the gateway now executes it.`,
  );
}

const http = readFileSync("convex/http.ts", "utf8");
assert.match(http, /rewriteLegacyProviderActionCall/);
assert.match(http, /synthesizeLegacyIdempotencyKey/);
assert.match(http, /handleManagedExecute/);
assert.match(http, /hasCustomerManagedCredential/);

const installPage = readFileSync("landing/src/app/install/page.tsx", "utf8");
assert.match(installPage, /api\.apiclaw\.cloud\/v1\/execute/);
assert.match(installPage, /"provider":"nasa"/);
assert.match(installPage, /"action":"apod"/);
assert.doesNotMatch(installPage, /replicate|elevenlabs|\/v1\/call/);
assert.doesNotMatch(installPage, /2\.5\.3/);

const docs = readFileSync("landing/src/app/docs/page.tsx", "utf8");
assert.match(docs, /fixer_latest/);
assert.match(docs, /nasa/);
assert.match(docs, /26,619/);
assert.doesNotMatch(docs, /elevenlabs|replicate|5,600|Firecrawl/);

// Homepage design reset (2026-08-23) split page.tsx into landing/src/components/home/*.
const HOME_DIR = "landing/src/components/home";
const homepage = [
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
].map((f) => readFileSync(f, "utf8")).join("\n");
assert.doesNotMatch(homepage, /16,?485|2\.5\.3/);
assert.match(homepage, /set up https:\/\/apiclaw\.cloud\/SKILL\.md/);
assert.doesNotMatch(homepage, /label: "npm installs"/);

assert.match(http, /npx @nordsym\/apiclaw auth login/);
assert.doesNotMatch(http, /run `apiclaw login`/);

for (const file of ["install.sh", "landing/public/install.sh", "landing/public/install.ps1"]) {
  const source = readFileSync(file, "utf8");
  assert.match(source, /npx @nordsym\/apiclaw auth login/);
  assert.match(source, /whoami/);
  assert.doesNotMatch(source, /Done!.*ready to use/i);
}

// HeroDoorsPreview.tsx was cut in the design reset; its first-run preview now lives in Hero.tsx.
const hero = readFileSync(`${HOME_DIR}/Hero.tsx`, "utf8");
assert.match(hero, /nasa/);
assert.match(hero, /apod/);
assert.match(hero, /v1\/execute/);
assert.doesNotMatch(hero, /elevenlabs|replicate|v1\/call/);

console.log("version trap: published 2.8.6 can execute; install/recovery use @latest; first-run uses unlocked rails");
