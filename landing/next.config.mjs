import { NEXT_CONFIG_DISCOVERY_REDIRECTS } from "./src/lib/discovery-aliases.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  webpack(config) {
    config.resolve.alias['@apiclaw/product-truth'] = new URL('../src/product-truth.ts', import.meta.url).pathname;
    return config;
  },
  async redirects() {
    return [
      // Well-known path aliases only. Case-variant doors (/AGENTS.md, /skill.md)
      // are handled in middleware with exact pathname matching — next.config
      // redirects are case-insensitive and would 308-loop the canonical files.
      ...NEXT_CONFIG_DISCOVERY_REDIRECTS.map(({ source, destination }) => ({
        source,
        destination,
        permanent: true,
      })),
      // /docs is a public page; no redirect to /workspace.
      {
        source: '/faq',
        destination: '/#faq',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/ingest/static/:path*", destination: "https://eu-assets.i.posthog.com/static/:path*" },
      { source: "/ingest/:path*", destination: "https://eu.i.posthog.com/:path*" },
      { source: "/ingest/decide", destination: "https://eu.i.posthog.com/decide" },
    ];
  },
};

export default nextConfig;
