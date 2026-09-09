import { DISCOVERY_DOOR_ALIASES } from "./src/lib/discovery-aliases.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  webpack(config) {
    config.resolve.alias['@apiclaw/product-truth'] = new URL('../src/product-truth.ts', import.meta.url).pathname;
    return config;
  },
  async redirects() {
    return [
      // Agents request case-variant / well-known discovery doors. permanent: true
      // is a 308 so SKILL.md, agents.md, and llms.txt stay the canonical URLs.
      ...DISCOVERY_DOOR_ALIASES.map(({ source, destination }) => ({
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
