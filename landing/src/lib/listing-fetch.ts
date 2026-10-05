import { resolve4 } from "node:dns/promises";
import { request } from "node:https";
import ipaddr from "ipaddr.js";
import { SPEC_LIMIT } from "./listing-import";
export function publicSpecUrl(value: string) {
  if (value.length > 2048)
    throw Error("Specification URL exceeds 2048 characters");
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.port && url.port !== "443") ||
    url.hostname.endsWith(".") ||
    !url.hostname.includes(".")
  )
    throw Error(
      "Use a public HTTPS specification URL without credentials or query parameters",
    );
  if (ipaddr.isValid(url.hostname))
    throw Error("Use a public DNS hostname, not an IP address");
  return url;
}
export function publicAddress(address: string) {
  return (
    ipaddr.isValid(address) &&
    ipaddr.parse(address).kind() === "ipv4" &&
    ipaddr.parse(address).range() === "unicast"
  );
}
export async function fetchListingSpec(
  value: string,
  network: {
    resolve: (hostname: string) => Promise<string[]>;
    request: typeof request;
  } = { resolve: resolve4, request },
): Promise<string> {
  const url = publicSpecUrl(value);
  let dnsTimer: ReturnType<typeof setTimeout>;
  const addresses = await Promise.race([
    network.resolve(url.hostname),
    new Promise<never>((_, reject) => {
      dnsTimer = setTimeout(() => reject(Error("DNS lookup timed out")), 3000);
    }),
  ]).finally(() => clearTimeout(dnsTimer));
  if (!addresses.length || addresses.some((a) => !publicAddress(a)))
    throw Error(
      "Specification host must resolve only to public IPv4 addresses",
    );
  // Pin the validated address to the actual socket. No second DNS lookup or redirect.
  return new Promise((resolve, reject) => {
    const req = network.request(
      url,
      {
        method: "GET",
        family: 4,
        headers: {
          Accept: "application/json, application/yaml, text/yaml",
          "Accept-Encoding": "identity",
        },
        lookup: ((_host: any, _opts: any, cb: any) =>
          cb(null, addresses[0], 4)) as any,
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          req.destroy();
          reject(Error("Specification URL must return 200 without redirects"));
          return;
        }
        if (
          res.headers["content-encoding"] &&
          res.headers["content-encoding"] !== "identity"
        ) {
          res.resume();
          req.destroy();
          reject(
            Error(
              "Compressed specifications are not supported; upload the file instead",
            ),
          );
          return;
        }
        let size = 0;
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => {
          size += chunk.length;
          if (size > SPEC_LIMIT)
            req.destroy(Error("Specification exceeds 1 MB"));
          else chunks.push(chunk);
        });
        res.on("error", reject);
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      },
    );
    const timer = setTimeout(
      () => req.destroy(Error("Specification download timed out")),
      8000,
    );
    req.on("close", () => clearTimeout(timer));
    req.on("error", reject);
    req.end();
  });
}
