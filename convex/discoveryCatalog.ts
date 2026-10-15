/** Server-owned catalog configuration. Discovery request bodies never select an upstream URL. */
export function discoveryCatalogRequest(
  params: URLSearchParams,
  config: { catalogUrl?: string; oidcToken?: string } = {
    catalogUrl: process.env.APICLAW_CATALOG_URL,
    oidcToken: process.env.APICLAW_CATALOG_OIDC_TOKEN,
  },
): { url: string; init: RequestInit } {
  let url: URL;
  try { url = new URL(config.catalogUrl ?? 'https://apiclaw.cloud/api/catalog'); }
  catch { throw new Error('Invalid catalog endpoint configuration'); }
  const preview = url.hostname.endsWith('.vercel.app');
  if (url.protocol !== 'https:' || url.username || url.password || url.hash || url.port
    || !(url.hostname === 'apiclaw.cloud' || preview) || url.pathname !== '/api/catalog') {
    throw new Error('Invalid catalog endpoint configuration');
  }
  params.forEach((value, key) => url.searchParams.set(key, value));
  const headers: Record<string, string> = {};
  // Use an existing server-side Vercel OIDC token only for a Vercel
  // preview. Reject redirects rather than forwarding this header elsewhere.
  if (preview && config.oidcToken) headers['x-vercel-trusted-oidc-idp-token'] = config.oidcToken;
  return { url: url.href, init: { headers, redirect: 'error', signal: AbortSignal.timeout(10_000) } };
}
