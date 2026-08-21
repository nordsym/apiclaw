#!/usr/bin/env node
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const modules = [
  ["../../src/product-truth.ts", "../src/lib/product-truth.generated.ts"],
  ["../../src/mcp-scope-policy.ts", "../src/lib/mcp-scope-policy.generated.ts"],
  ["../../src/canon-stats.ts", "../src/lib/canon-stats.generated.ts"],
  ["../../src/workspace-public-apis.json", "../src/lib/workspace-public-apis.json"],
];

for (const [sourceRelative, generatedRelative] of modules) {
  const source = resolve(here, sourceRelative);
  const generated = resolve(here, generatedRelative);
  if (process.env.APICLAW_ISOLATED_LANDING_BUILD !== "1" && existsSync(source)) {
    copyFileSync(source, generated);
    continue;
  }
  if (!existsSync(generated) || readFileSync(generated, "utf8").trim() === "") {
    throw new Error(`Missing generated runtime module: ${generatedRelative}`);
  }
}

console.log("Landing runtime modules are synchronized");
