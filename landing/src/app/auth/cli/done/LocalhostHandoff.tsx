"use client";

import { useEffect } from "react";

function loopbackCallbackUrl(port: string, code: string, state: string): string | null {
  const parsed = Number(port);
  if (!Number.isInteger(parsed) || parsed < 1024 || parsed > 65535) return null;
  if (!code || !state) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(code) || !/^[A-Za-z0-9_-]+$/.test(state)) return null;
  return `http://127.0.0.1:${parsed}/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
}

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

export { loopbackCallbackUrl };
