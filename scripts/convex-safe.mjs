import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { parse } from "dotenv";

// This module performs no CLI calls when imported by the guard tests.
export function planConvexCommand(command, args, env, cwd) {
  if (!["dev", "deploy"].includes(command)) throw new Error("Expected dev or deploy");
  if (args.some((arg, index) => arg === "--typecheck=disable" ||
      (arg === "--typecheck" && args[index + 1] === "disable"))) {
    throw new Error("Typechecking cannot be disabled");
  }
  const settings = [env];
  for (const file of [".env", ".env.local"]) {
    const path = resolve(cwd, file);
    if (existsSync(path)) settings.push(parse(readFileSync(path)));
  }
  // Custom selectors can hide a production target. Treat them as production.
  const customTarget = args.some((arg) =>
    /^--(?:prod|env-file|deployment(?:-name)?|url|admin-key|deploy-key)(?:=|$)/.test(arg));
  const knownDev = settings.some((setting) => /^(dev|local):/.test(setting.CONVEX_DEPLOYMENT ?? ""));
  const unsafeSetting = settings.some((setting) =>
    Object.entries(setting).some(([key, value]) =>
      /(?:DEPLOY_KEY|CONVEX_(?:URL|SELF_HOSTED_URL|SELF_HOSTED_ADMIN_KEY))$/.test(key) && Boolean(value)) ||
    (setting.CONVEX_DEPLOYMENT && !/^(dev|local):/.test(setting.CONVEX_DEPLOYMENT)));
  const needsConfirmation = command === "deploy" || customTarget || unsafeSetting || !knownDev;
  // Confirmation lives in the invoking process, never in an auto-loaded file.
  if (needsConfirmation && env.APICLAW_CONFIRM_PRODUCTION !== command) {
    throw new Error(`Refusing possible production ${command}. After owner approval, set APICLAW_CONFIRM_PRODUCTION=${command} for this command.`);
  }
  return { command, args, typecheck: command === "deploy" };
}

export function main(argv = process.argv.slice(2), env = process.env, cwd = process.cwd()) {
  try {
    const plan = planConvexCommand(argv[0], argv.slice(1), env, cwd);
    if (plan.typecheck) {
      for (const project of ["tsconfig.json", "convex/tsconfig.json", "landing/tsconfig.json"]) {
        const result = spawnSync(resolve(cwd, "node_modules/.bin/tsc"), ["--noEmit", "-p", project], { cwd, env, stdio: "inherit" });
        if (result.status !== 0) return result.status ?? 1;
      }
    }
    const result = spawnSync(resolve(cwd, "node_modules/.bin/convex"), [plan.command, ...plan.args], { cwd, env, stdio: "inherit" });
    return result.status ?? 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Convex guard failed");
    return 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main();
