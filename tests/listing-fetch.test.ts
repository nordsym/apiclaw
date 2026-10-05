import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { Readable } from "node:stream";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { fetchListingSpec } = require("../landing/src/lib/listing-fetch.ts");
let requests = 0;
function network(status = 200, headers = {}, content = '{"ok":true}') {
  return {
    resolve: async () => ["8.8.8.8"],
    request: (_url: URL, options: any, receive: any) => {
      requests++;
      options.lookup(
        "spec.example",
        {},
        (error: any, address: string, family: number) => {
          assert.equal(error, null);
          assert.equal(address, "8.8.8.8");
          assert.equal(family, 4);
        },
      );
      assert.equal(options.headers["Accept-Encoding"], "identity");
      const req: any = new EventEmitter();
      req.destroy = (error?: Error) => {
        if (error) req.emit("error", error);
        req.emit("close");
      };
      req.end = () =>
        queueMicrotask(() => {
          const response: any = Readable.from([Buffer.from(content)]);
          response.statusCode = status;
          response.headers = headers;
          response.once("end", () => req.emit("close"));
          receive(response);
        });
      return req;
    },
  };
}
assert.equal(
  await fetchListingSpec("https://spec.example/openapi", network()),
  '{"ok":true}',
);
await assert.rejects(
  fetchListingSpec("https://spec.example/openapi", {
    ...network(),
    resolve: async () => ["8.8.8.8", "127.0.0.1"],
  }),
  /public IPv4/,
);
assert.equal(requests, 1, "Mixed DNS results must not open a socket");
await assert.rejects(
  fetchListingSpec(
    "https://spec.example/openapi",
    network(302, { location: "http://169.254.169.254/" }),
  ),
  /without redirects/,
);
await assert.rejects(
  fetchListingSpec(
    "https://spec.example/openapi",
    network(200, { "content-encoding": "gzip" }),
  ),
  /Compressed/,
);
await assert.rejects(
  fetchListingSpec(
    "https://spec.example/openapi",
    network(200, {}, "x".repeat(1024 * 1024 + 1)),
  ),
  /1 MB/,
);
console.log(
  "PASS: URL import pins public DNS, blocks mixed/private DNS and redirects, rejects compressed/oversize responses",
);
