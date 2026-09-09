#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  DISCOVERY_DOOR_ALIASES,
  NEXT_CONFIG_DISCOVERY_REDIRECTS,
  canonicalDiscoveryPath,
} from "./discovery-aliases.mjs";

assert.deepEqual(
  DISCOVERY_DOOR_ALIASES.map(({ source, destination }) => [source, destination]),
  [
    ["/AGENTS.md", "/agents.md"],
    ["/skill.md", "/SKILL.md"],
    ["/.well-known/llms.txt", "/llms.txt"],
  ],
);

assert.equal(canonicalDiscoveryPath("/AGENTS.md"), "/agents.md");
assert.equal(canonicalDiscoveryPath("/skill.md"), "/SKILL.md");
assert.equal(canonicalDiscoveryPath("/.well-known/llms.txt"), "/llms.txt");

// Canonical doors and other case folds must not redirect.
assert.equal(canonicalDiscoveryPath("/agents.md"), null);
assert.equal(canonicalDiscoveryPath("/SKILL.md"), null);
assert.equal(canonicalDiscoveryPath("/llms.txt"), null);
assert.equal(canonicalDiscoveryPath("/Agents.md"), null);
assert.equal(canonicalDiscoveryPath("/SKILL.MD"), null);

assert.deepEqual(
  NEXT_CONFIG_DISCOVERY_REDIRECTS.map(({ source, destination }) => [source, destination]),
  [["/.well-known/llms.txt", "/llms.txt"]],
);

const nextConfig = readFileSync(new URL("../../next.config.mjs", import.meta.url), "utf8");
assert.match(nextConfig, /NEXT_CONFIG_DISCOVERY_REDIRECTS/);
assert.match(nextConfig, /permanent:\s*true/);
assert.doesNotMatch(nextConfig, /source:\s*['"]\/AGENTS\.md['"]/);
assert.doesNotMatch(nextConfig, /source:\s*['"]\/skill\.md['"]/);

const middleware = readFileSync(new URL("../../middleware.ts", import.meta.url), "utf8");
assert.match(middleware, /canonicalDiscoveryPath/);
assert.match(middleware, /NextResponse\.redirect\(target,\s*308\)/);

const agentsRoute = readFileSync(new URL("../app/AGENTS.md/route.ts", import.meta.url), "utf8");
const skillRoute = readFileSync(new URL("../app/skill.md/route.ts", import.meta.url), "utf8");
assert.match(agentsRoute, /NextResponse\.redirect\([\s\S]+,\s*308\)/);
assert.match(skillRoute, /NextResponse\.redirect\([\s\S]+,\s*308\)/);

const sitemap = readFileSync(new URL("../../public/sitemap.xml", import.meta.url), "utf8");
assert.match(sitemap, /https:\/\/apiclaw\.cloud\/agents\.md/);
assert.match(sitemap, /https:\/\/apiclaw\.cloud\/\.well-known\/mcp/);
assert.match(sitemap, /https:\/\/apiclaw\.cloud\/SKILL\.md/);
assert.match(sitemap, /https:\/\/apiclaw\.cloud\/llms\.txt/);

console.log("discovery door aliases: 308 map, next.config, middleware, sitemap");
