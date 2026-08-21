#!/usr/bin/env node
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const modules = [
  ["../../src/product-truth.ts", "../src/lib/product-truth.generated.ts"],
  ["../../src/mcp-scope-policy.ts", "../src/lib/mcp-scope-policy.generated.ts"],
  ["../../src/canon-stats.ts", "../src/lib/canon-stats.generated.ts"],
  ["../../src/workspace-public-apis.ts", "../src/lib/workspace-public-apis.ts"],
  ["../../src/workspace-public-apis.generated.ts", "../src/lib/workspace-public-apis.generated.ts"],
];

for (const [sourceRelative, generatedRelative] of modules) {
  const source = resolve(here, sourceRelative);
  const generated = resolve(here, generatedRelative);
  if (process.env.APICLAW_ISOLATED_LANDING_BUILD !== "1" && existsSync(source)) {
    copyFileSync(source, generated);
    if (generatedRelative.endsWith("workspace-public-apis.ts") && !generatedRelative.includes("generated")) {
      const rewritten = readFileSync(generated, "utf8").replace(
        'from "./product-truth.js"',
        'from "@apiclaw/product-truth"',
      );
      writeFileSync(generated, rewritten);
    }
    continue;
  }
  if (!existsSync(generated) || readFileSync(generated, "utf8").trim() === "") {
    throw new Error(`Missing generated runtime module: ${generatedRelative}`);
  }
}

console.log("Landing runtime modules are synchronized");
