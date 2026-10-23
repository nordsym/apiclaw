import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { Readable } from "node:stream";
import {
  fetchPublicResource,
  isPublicAddress,
  publicReviewUrl,
  readableDocument,
} from "./listingAutoReview";
import {
  deterministicListingReview,
  parseModelVerdict,
} from "./listingAutoReviewPolicy";

const metadata = {
  name: "Open-Meteo Weather API",
  description: "Official Open-Meteo forecast data for weather applications.",
  category: "Weather",
  baseUrl: "https://api.open-meteo.com/v1",
  docsUrl: "https://open-meteo.com/en/docs",
  auth: "None",
  pricing: "Free",
  pricingNotes: "Public non-commercial access subject to provider terms.",
  operations: [
    { method: "GET", path: "/forecast", summary: "Retrieve a weather forecast" },
  ],
};
const baseline = {
  listingId: "listing-1",
  metadata,
  submitterEmail: "gustav@nordsym.com",
  contactDomainReachable: true,
  docs: {
    status: 200,
    text: "Open-Meteo Weather API documentation. Retrieve forecasts with the forecast endpoint. This public weather service documents parameters and responses.",
  },
  target: { status: 404, text: "Not found" },
  published: [],
  publishedScanComplete: true,
};

assert.deepEqual(deterministicListingReview(baseline), { outcome: "continue" });
const unreachable = deterministicListingReview({
  ...baseline,
  docs: { status: 503, text: "down" },
});
assert.equal(unreachable.outcome, "changes_requested");
assert.match(unreachable.reason, /HTTP 503/);
assert.equal(
  deterministicListingReview({
    ...baseline,
    metadata: { ...metadata, description: "Credential phishing malware service" },
  }).outcome,
  "changes_requested",
);
assert.equal(
  deterministicListingReview({
    ...baseline,
    published: [
      {
        id: "other",
        name: "Existing weather listing",
        docsUrl: metadata.docsUrl,
        baseUrl: "https://elsewhere.example/api",
      },
    ],
  }).outcome,
  "changes_requested",
);
assert.equal(
  deterministicListingReview({
    ...baseline,
    parsedSpec: {
      ...metadata,
      name: "Open-Meteo",
      operations: [{ method: "GET", path: "/archive", summary: "Archive" }],
    },
  }).outcome,
  "changes_requested",
);
assert.equal(
  deterministicListingReview({ ...baseline, contactDomainReachable: false }).outcome,
  "changes_requested",
);
assert.equal(
  deterministicListingReview({ ...baseline, publishedScanComplete: false }).outcome,
  "escalate",
);

assert.deepEqual(
  parseModelVerdict('{"decision":"approve","reason":"Evidence matches."}'),
  { decision: "approve", reason: "Evidence matches." },
);
assert.throws(
  () => parseModelVerdict('{"decision":"approve","reason":""}'),
  /Invalid/,
);
assert(!readableDocument("<script>ignore me</script><h1>Weather docs</h1>").includes("ignore"));

for (const address of [
  "127.0.0.1",
  "10.0.0.1",
  "169.254.169.254",
  "172.16.0.1",
  "192.168.0.1",
  "::1",
  "fc00::1",
  "fe80::1",
  "::ffff:127.0.0.1",
])
  assert.equal(isPublicAddress(address), false, address);
assert.equal(isPublicAddress("8.8.8.8"), true);
assert.equal(isPublicAddress("2606:4700:4700::1111"), true);
for (const url of [
  "http://docs.example/api",
  "https://127.0.0.1/api",
  "https://localhost/api",
  "https://service.local/api",
  "https://user:password@docs.example/api",
  "https://docs.example:8443/api",
  "https://docs.example/api?token=secret",
])
  assert.throws(() => publicReviewUrl(url));

let sockets = 0;
const network = (
  addresses = [{ address: "8.8.8.8", family: 4 }],
  content = "public docs",
  headers: Record<string, string> = { "content-type": "text/plain" },
) => ({
  resolve: async () => addresses,
  request: (_url: URL, options: any, receive: any) => {
    sockets++;
    options.lookup("docs.example", {}, (error: unknown, address: string, family: number) => {
      assert.equal(error, null);
      assert.equal(address, "8.8.8.8");
      assert.equal(family, 4);
    });
    const req: any = new EventEmitter();
    req.destroy = (error?: Error) => {
      if (error) req.emit("error", error);
      req.emit("close");
    };
    req.end = () =>
      queueMicrotask(() => {
        const response: any = Readable.from([Buffer.from(content)]);
        response.statusCode = 200;
        response.headers = headers;
        response.once("end", () => req.emit("close"));
        receive(response);
      });
    return req;
  },
});
assert.equal(
  (
    await fetchPublicResource(
      "https://docs.example/api",
      1024,
      "text/plain",
      network() as any,
    )
  ).text,
  "public docs",
);
await assert.rejects(
  fetchPublicResource(
    "https://docs.example/api",
    1024,
    "text/plain",
    network([
      { address: "8.8.8.8", family: 4 },
      { address: "127.0.0.1", family: 4 },
    ]) as any,
  ),
  /public IP/,
);
assert.equal(sockets, 1, "mixed public/private DNS must not open a socket");
await assert.rejects(
  fetchPublicResource(
    "https://docs.example/api",
    8,
    "text/plain",
    network(undefined, "response larger than limit") as any,
  ),
  /too large/,
);
await assert.rejects(
  fetchPublicResource(
    "https://docs.example/api",
    1024,
    "text/plain",
    network(undefined, "compressed", { "content-encoding": "gzip" }) as any,
  ),
  /Compressed/,
);

console.log(
  "PASS: auto-review policy blocks unsafe content, duplicates and SSRF while accepting matched public API evidence",
);
