import assert from "node:assert/strict";
import { decodeWorkspaceResponse, validateWorkspacePayload, workspaceRequest, requestGeneration, getWorkspaceRevision, invalidateWorkspace, subscribeWorkspaceData } from "./workspace-data";

async function main() {
assert.equal(decodeWorkspaceResponse({ status: "success", value: null }, true), null);
assert.deepEqual(decodeWorkspaceResponse({ status: "success", value: [] }, true), []);
assert.throws(() => decodeWorkspaceResponse({ status: "error", errorMessage: "Unavailable" }, true));
assert.throws(() => decodeWorkspaceResponse({ status: "success", value: [] }, false));
assert.throws(() => validateWorkspacePayload("logs:getLogStats", {}));
assert.throws(() => validateWorkspacePayload("billing:getBillingInfo", {invoices:[]}));
assert.throws(() => validateWorkspacePayload("agents:getWorkspaceAgents", null));
validateWorkspacePayload("agents:getWorkspaceAgents", []);
const guard = requestGeneration(); const first = guard.next(); const second = guard.next();
assert.equal(guard.current(first), false, "old reads cannot replace a new result");
assert.equal(guard.current(second), true); guard.cancel();
assert.equal(guard.current(second), false, "unmounted reads cannot commit");
let updates = 0; const stop = subscribeWorkspaceData(() => updates++);
invalidateWorkspace(); assert.equal(updates, 1); stop(); invalidateWorkspace(); assert.equal(updates, 1);
const original = globalThis.fetch;
let calls = 0; let recovered = 0;
let failMutation = true;
globalThis.fetch = async (url, init) => {
 if (url === "/api/workspace-auth/session") {
  recovered++;
  return new Response(JSON.stringify({browserToken:"browser_synthetic_renewed_abcdefghijklmnopqrstuvwxyz", browserExpiresAt:Date.now()+900_000}));
 }
 calls++;
 const {path, args} = JSON.parse(String(init?.body));
 if (path === "test:save") return new Response(JSON.stringify(failMutation ? {status:"error",errorMessage:"Invalid or expired session"} : {status:"success",value:{saved:true}}));
 return new Response(JSON.stringify(args.token === "rejected" ? {status:"error",errorMessage:"Invalid or expired session"} : {status:"success",value:{tier:"founder"}}));
};
try {
 const value = await workspaceRequest<{tier:string}>("query", "test:read", {token:"rejected"});
 assert.equal(value.tier, "founder"); assert.equal(calls, 2); assert.equal(recovered, 1);
 const before = getWorkspaceRevision();
 await assert.rejects(workspaceRequest("mutation", "test:save", {token:"rejected"}));
 assert.equal(recovered, 1, "a failed mutation must never be replayed");
 assert.equal(getWorkspaceRevision(), before, "failed persistence is not published as success");
 failMutation = false;
 await workspaceRequest("mutation", "test:save", {token:"good"});
 assert.equal(getWorkspaceRevision(), before+1, "confirmed save refreshes consumers");
} finally { globalThis.fetch = original; }
console.log("workspace data: unknown/empty/error, read recovery, no mutation replay, invalidation, request generations passed");
}
void main();
