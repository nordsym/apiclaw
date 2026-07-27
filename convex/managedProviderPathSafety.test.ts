#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  elevenLabsTextToSpeechUrl,
  nasaReadOnlyMethod,
  replicateModelPredictionsUrl,
  replicatePredictionUrl,
} from "./http";

assert.equal(nasaReadOnlyMethod(undefined), "GET");
assert.equal(nasaReadOnlyMethod("get"), "GET");
for (const unsafeMethod of ["POST", "PUT", "PATCH", "DELETE", "HEAD"]) {
  assert.throws(() => nasaReadOnlyMethod(unsafeMethod), /read-only/);
}

const httpSource = readFileSync(fileURLToPath(new URL("./http.ts", import.meta.url)), "utf8");
assert.match(httpSource, /code: error instanceof RangeError \? "request_body_too_large" : "invalid_json"/);
assert.doesNotMatch(httpSource, /readManagedJsonBodyCapped\(request\); \} catch \{\}/);

const voiceId = "21m00Tcm4TlvDq8ikWAM";
const voiceUrl = elevenLabsTextToSpeechUrl(voiceId);
assert.equal(voiceUrl, `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`);
assert.equal(new URL(voiceUrl).pathname, `/v1/text-to-speech/${voiceId}`);

const predictionId = "r8n4m3d-pr3d1ct10n";
const predictionUrl = replicatePredictionUrl(predictionId);
assert.equal(predictionUrl, `https://api.replicate.com/v1/predictions/${predictionId}`);
assert.equal(new URL(predictionUrl).pathname, `/v1/predictions/${predictionId}`);

const model = "black-forest-labs/flux-schnell";
const modelUrl = replicateModelPredictionsUrl(model);
assert.equal(modelUrl, "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions");
assert.equal(new URL(modelUrl).pathname, "/v1/models/black-forest-labs/flux-schnell/predictions");

const unsafeSingleSegments: unknown[] = [
  undefined,
  null,
  0,
  {},
  "",
  ".",
  "..",
  "../admin",
  "%2e%2e/admin",
  "%2e%2e%2fadmin",
  "%252e%252e%252fadmin",
  "safe/extra",
  "safe?query=1",
  "safe#fragment",
  "safe\\extra",
  "safe%2fextra",
  "safe%2Fextra",
  "safe%5cextra",
  "safe%5Cextra",
  "safe%3fquery",
  "safe%23fragment",
  "safe segment",
  "safe∕extra",
];

for (const unsafe of unsafeSingleSegments) {
  assert.throws(() => elevenLabsTextToSpeechUrl(unsafe), RangeError, `voice ID must reject ${JSON.stringify(unsafe)}`);
  assert.throws(() => replicatePredictionUrl(unsafe), RangeError, `prediction ID must reject ${JSON.stringify(unsafe)}`);
}

const unsafeModels: unknown[] = [
  null,
  {},
  "owner",
  "/model",
  "owner/",
  "owner/model/extra",
  "../model",
  "owner/../model",
  "owner/%2e%2e",
  "%2e%2e/model",
  "owner/model?query=1",
  "owner/model#fragment",
  "owner\\model",
  "owner%2fmodel",
  "owner/model%2fpredictions",
  "owner/model%5cpredictions",
  "owner/model%252fpredictions",
  "owner/model∕predictions",
];

for (const unsafe of unsafeModels) {
  assert.throws(() => replicateModelPredictionsUrl(unsafe), RangeError, `Replicate model must reject ${JSON.stringify(unsafe)}`);
}

console.log("managed provider path safety: credentialed dynamic routes stay origin- and path-pinned");
