export function loopbackCallbackUrl(port: string, code: string, state: string): string | null {
  const parsed = Number(port);
  if (!Number.isInteger(parsed) || parsed < 1024 || parsed > 65535) return null;
  if (!code || !state) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(code) || !/^[A-Za-z0-9_-]+$/.test(state)) return null;
  return `http://127.0.0.1:${parsed}/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
}
