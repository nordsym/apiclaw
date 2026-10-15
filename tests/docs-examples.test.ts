/** Execute the exact curl snippets rendered by /docs and /install.
 * Default: a local HTTP contract server. Preview smoke:
 * APICLAW_DOCS_EXECUTE_URL=https://<preview>/v1/execute
 * APICLAW_DOCS_SESSION=<private preview session> npx tsx tests/docs-examples.test.ts
 * Credentials are read from the environment and never printed.
 */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { DOCS_EXECUTE_EXAMPLES, DOCS_EXECUTE_URL, docsExecuteBody, docsHttpExample } = require("../landing/src/lib/docs-examples.ts") as typeof import("../landing/src/lib/docs-examples.js");
import { buildCallGatewayRequest } from "../src/cli/commands/direct.js";

const liveUrl = process.env.APICLAW_DOCS_EXECUTE_URL;
const liveSession = process.env.APICLAW_DOCS_SESSION;
if (liveUrl && !liveSession) throw new Error("Preview docs check needs APICLAW_DOCS_SESSION");
if (liveUrl && new URL(liveUrl).protocol !== "https:") throw new Error("Preview endpoint must use HTTPS");
const session = liveSession || `docs-test-${randomUUID()}`;
const observed: unknown[] = [];
const server = createServer(async (req, res) => {
  assert.equal(req.method, "POST");
  assert.equal(req.url, "/v1/execute");
  assert.equal(req.headers["x-apiclaw-session"], session);
  assert.equal(req.headers.authorization, undefined);
  assert.equal(req.headers["content-type"], "application/json");
  assert.ok(req.headers["idempotency-key"]);
  let text = "";
  for await (const chunk of req) text += chunk;
  const body = JSON.parse(text);
  assert.deepEqual(body, docsExecuteBody(DOCS_EXECUTE_EXAMPLES[observed.length]));
  observed.push(body);
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ success: true, data: body.provider === "nasa" ? { title: "A test astronomy image" } : { rates: { USD: 1.1 } } }));
});

async function curl(command: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const child = spawn("bash", ["-c", command], { env: { ...process.env, SESSION: session }, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    // Never print raw responses or stderr: upstreams could echo credentials.
    child.stderr.resume();
    child.on("error", () => reject(new Error("Could not start curl")));
    child.on("exit", (code) => {
      if (code !== 0) return reject(new Error(`Docs curl failed with exit ${code}`));
      try { resolve(JSON.parse(stdout)); } catch { reject(new Error("Docs call did not return JSON")); }
    });
  });
}

try {
  if (!liveUrl) await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const endpoint = liveUrl || `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}/v1/execute`;
  for (const example of DOCS_EXECUTE_EXAMPLES) {
    const cliRequest = buildCallGatewayRequest(`${example.provider}/${example.action}`, { params: example.params });
    assert.equal(cliRequest.path, "/v1/execute");
    assert.deepEqual(cliRequest.body, docsExecuteBody(example));
    const response = await curl(docsHttpExample(example).replace(DOCS_EXECUTE_URL, endpoint));
    assert.ok(response && typeof response === "object");
    const root = response as Record<string, unknown>;
    assert.notEqual(root.success, false, `${example.provider}: gateway rejected docs example`);
    const data = (root.data || root) as Record<string, unknown>;
    if (example.provider === "nasa") assert.equal(typeof data.title, "string", "NASA docs example must return an APOD title");
    else assert.equal(typeof (data.rates as Record<string, unknown>)?.USD, "number", "Frankfurter docs example must return a USD rate");
    console.log(`docs examples: ${example.provider}/${example.action} ${liveUrl ? "preview" : "HTTP contract"} passed`);
  }
  if (!liveUrl) assert.equal(observed.length, DOCS_EXECUTE_EXAMPLES.length);
  for (const file of ["landing/src/app/docs/page.tsx", "landing/src/app/install/page.tsx"]) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /docsHttpExample/, `${file} must render the tested curl examples`);
    assert.doesNotMatch(source, /Authorization: Bearer sk-claw|fixer_latest|brave_search|apilayer\/fixer/);
  }
} finally {
  server.close();
}
