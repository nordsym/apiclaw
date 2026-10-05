// Transform a saved Inbound Net workflow without copying credentials into the repository.
// Usage: node scripts/configure-listing-review-alert.mjs input.json output.json
import fs from "node:fs";
import assert from "node:assert/strict";
const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error("Input and output paths required");
const workflow = JSON.parse(fs.readFileSync(input, "utf8"));
const target = workflow.nodes.find((n) => n.name === "Send ALERT to Telegram");
assert(target?.type === "n8n-nodes-base.telegram");
assert(
  workflow.nodes.find((n) => n.type === "n8n-nodes-base.webhook")?.parameters
    .responseMode === "lastNode",
);
const previous = target.parameters.text;
assert(
  !previous.includes("listing_review"),
  "Already configured; inspect live state",
);
const parts = previous
  .slice(1)
  .split(/(\{\{[\s\S]*?\}\})/g)
  .filter(Boolean)
  .map((p) =>
    p.startsWith("{{") ? "(" + p.slice(2, -2).trim() + ")" : JSON.stringify(p),
  );
target.parameters.text =
  '={{ $json.body.event === "listing_review" ? "🦞 APIClaw: API listing awaiting review\\n\\nRevision: " + Number($json.body.revision) + "\\nhttps://apiclaw.cloud/workspace/review-listings?listing=" + encodeURIComponent(String($json.body.listingId)) + "\\n\\nSign in as gustav@nordsym.com. Discovery only. Review ownership before approving." : (' +
  parts.join(" + ") +
  ") }}";
const evaluate = (body) =>
  Function("$json", "return " + target.parameters.text.slice(3, -2))({ body });
for (const event of [
  "signup",
  "login",
  "activation_stalled",
  "oauth_passthrough_reconciliation_required",
]) {
  const body = {
    event,
    email: "synthetic@example.test",
    tier: "free",
    workspaceId: "fixture",
    requestId: "fixture",
    path: "/fixture",
    code: "fixture",
    attempts: 1,
  };
  const expected = previous
    .slice(1)
    .replace(/\{\{([\s\S]*?)\}\}/g, (_, expr) =>
      Function("$json", "return " + expr)({ body }),
    );
  assert.equal(evaluate(body), expected, event + " changed");
}
assert(
  evaluate({
    event: "listing_review",
    listingId: "fixture",
    revision: 2,
  }).includes("/workspace/review-listings?listing=fixture"),
);
fs.writeFileSync(
  output,
  JSON.stringify({
    name: workflow.name,
    nodes: workflow.nodes,
    connections: workflow.connections,
    settings: workflow.settings,
  }),
  { mode: 0o600 },
);
console.log("PASS: review alert added; existing event rendering preserved");
