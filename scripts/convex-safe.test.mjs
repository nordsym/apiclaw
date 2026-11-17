import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { planConvexCommand } from "./convex-safe.mjs";

const cwd = mkdtempSync(join(tmpdir(), "apiclaw-convex-guard-"));
const dev = { CONVEX_DEPLOYMENT: "dev:fixture" };
test("unknown, production and deploy-key targets fail closed", () => {
  for (const env of [{}, { CONVEX_DEPLOYMENT: "prod:fixture" }, { ...dev, CONVEX_DEPLOY_KEY: "synthetic" }, { ...dev, CONVEX_SELF_HOSTED_URL: "https://example.invalid" }]) {
    for (const command of ["dev", "deploy"]) assert.throws(() => planConvexCommand(command, [], env, cwd), /Refusing/);
  }
  assert.throws(() => planConvexCommand("deploy", [], dev, cwd), /Refusing/);
  assert.equal(planConvexCommand("dev", [], dev, cwd).typecheck, false);
});
test("production confirmation is explicit and command-specific", () => {
  assert.equal(planConvexCommand("deploy", [], { APICLAW_CONFIRM_PRODUCTION: "deploy" }, cwd).typecheck, true);
  assert.throws(() => planConvexCommand("dev", [], { APICLAW_CONFIRM_PRODUCTION: "deploy" }, cwd), /Refusing/);
  for (const args of [["--prod"], ["--env-file=custom"], ["--deployment-name", "fixture"], ["--url=https://example.invalid"]]) {
    assert.throws(() => planConvexCommand("dev", args, dev, cwd), /Refusing/);
  }
  for (const args of [["--typecheck=disable"], ["--typecheck", "disable"]]) {
    assert.throws(() => planConvexCommand("deploy", args, { APICLAW_CONFIRM_PRODUCTION: "deploy" }, cwd), /cannot be disabled/);
  }
});
test("dotenv production settings cannot bypass a safe process setting", () => {
  writeFileSync(join(cwd, ".env.local"), "CONVEX_DEPLOYMENT=prod:fixture\nAPICLAW_CONFIRM_PRODUCTION=dev\n");
  assert.throws(() => planConvexCommand("dev", [], dev, cwd), /Refusing/);
});
