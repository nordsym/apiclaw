"use client";

import { useEffect } from "react";
import { loopbackCallbackUrl } from "./loopback";

export function LocalhostHandoff({
  port,
  code,
  state,
}: {
  port?: string;
  code?: string;
  state?: string;
}) {
  useEffect(() => {
    if (!port || !code || !state) return;
    const url = loopbackCallbackUrl(port, code, state);
    if (!url) return;
    void fetch(url, { mode: "no-cors", cache: "no-store", keepalive: true }).catch(() => {});
  }, [port, code, state]);

  return null;
}
