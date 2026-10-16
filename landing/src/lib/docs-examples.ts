/** Public execute examples. The docs and runnable smoke check consume these exact bodies. */
export const DOCS_EXECUTE_URL = "https://api.apiclaw.cloud/v1/execute";

export const DOCS_EXECUTE_EXAMPLES = [
  { title: "NASA Astronomy Picture of the Day", provider: "nasa", action: "apod", params: {} },
  { title: "Latest EUR exchange rates", provider: "frankfurter", action: "latest", params: { path: "/latest" } },
] as const;

export function docsExecuteBody(example: typeof DOCS_EXECUTE_EXAMPLES[number]) {
  return { provider: example.provider, action: example.action, params: example.params };
}

export function docsCliExample(example: typeof DOCS_EXECUTE_EXAMPLES[number]) {
  return `npx @nordsym/apiclaw call ${example.provider}/${example.action} --params '${JSON.stringify(example.params)}'`;
}

export function docsHttpExample(example: typeof DOCS_EXECUTE_EXAMPLES[number]) {
  return `curl -sS --fail-with-body --max-time 30 ${DOCS_EXECUTE_URL} \\\n  -H "Content-Type: application/json" \\\n  -H "X-APIClaw-Session: $SESSION" \\\n  -H "Idempotency-Key: docs-${example.provider}-$(date +%s)" \\\n  -d '${JSON.stringify(docsExecuteBody(example))}'`;
}

// Read credentials locally, without printing them or putting them in chat.
export const DOCS_SESSION_SETUP = `npx @nordsym/apiclaw auth whoami || exit 1
SESSION=$(node -e 'const fs=require("fs"),os=require("os"),p=require("path");const t=p.join(os.homedir(),".apiclaw.toml");const m=fs.existsSync(t)&&fs.readFileSync(t,"utf8").match(/session_token\\s*=\\s*"([^"]+)"/);if(!m||!m[1].trim())process.exit(1);process.stdout.write(m[1])')
if [ -z "$SESSION" ]; then echo "Sign in first: npx @nordsym/apiclaw auth login"; exit 1; fi`;
