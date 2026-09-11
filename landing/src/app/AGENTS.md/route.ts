import { NextResponse } from "next/server";
import { canonicalDiscoveryPath } from "../../lib/discovery-aliases.mjs";

export function GET(request: Request) {
  const destination = canonicalDiscoveryPath(new URL(request.url).pathname) ?? "/agents.md";
  return NextResponse.redirect(new URL(destination, request.url), 308);
}

export function HEAD(request: Request) {
  return GET(request);
}
