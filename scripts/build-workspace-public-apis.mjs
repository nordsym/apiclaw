#!/usr/bin/env node
/**
 * Build the workspace-authenticated public API allowlist.
 *
 * Reads the public catalog + exact-name verification, keeps no-key HTTPS
 * origins that are not spec/docs hosts or managed-adapter aliases, and
 * writes src/workspace-public-apis.json plus a JSON.parse data module.
 */
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
// Runtime eligibility comes from measured results, never heuristic auth flags.
execFileSync(process.execPath, [fileURLToPath(new URL("./refresh-callable.mjs", import.meta.url))], { stdio: "inherit" });
