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
];

for (const file of files) {
  const source = readFileSync(file, "utf8");
  assert.doesNotMatch(
    source,
    /@nordsym\/apiclaw@latest/,
    `${file} must not install npm @latest while published latest is rejected by the gateway`,
  );
}

const http = readFileSync("convex/http.ts", "utf8");
assert.match(http, /rewriteLegacyProviderActionCall/);
assert.match(http, /synthesizeLegacyIdempotencyKey/);
assert.match(http, /handleManagedExecute/);
assert.doesNotMatch(http, /npm install -g @nordsym\/apiclaw@latest/);

const installPage = readFileSync("landing/src/app/install/page.tsx", "utf8");
assert.match(installPage, /api\.apiclaw\.cloud\/v1\/execute/);
assert.match(installPage, /"provider":"nasa"/);
assert.match(installPage, /"action":"apod"/);
assert.doesNotMatch(installPage, /replicate|elevenlabs|\/v1\/call/);

const docs = readFileSync("landing/src/app/docs/page.tsx", "utf8");
assert.match(docs, /fixer_latest/);
assert.match(docs, /nasa/);
assert.match(docs, /26,619/);
assert.doesNotMatch(docs, /elevenlabs|replicate|5,600|Firecrawl/);
assert.doesNotMatch(installPage, /2\.5\.3/);

const homepage = readFileSync("landing/src/app/page.tsx", "utf8");
assert.doesNotMatch(homepage, /16,?485|2\.5\.3/);

assert.match(http, /apiclaw auth login/);
assert.doesNotMatch(http, /run `apiclaw login`/);

const hero = readFileSync("landing/src/components/HeroDoorsPreview.tsx", "utf8");
assert.match(hero, /nasa/);
assert.match(hero, /apod/);
assert.match(hero, /v1\/execute/);
assert.doesNotMatch(hero, /elevenlabs|replicate|v1\/call/);

console.log("version trap: 2.8.6 clients can execute; install/recovery pin 2.8.7; first-run uses unlocked rails");
