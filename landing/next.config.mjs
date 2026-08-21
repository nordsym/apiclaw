/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  webpack(config) {
    config.resolve.alias['@apiclaw/product-truth'] = new URL('../src/product-truth.ts', import.meta.url).pathname;
    config.resolve.alias['@apiclaw/workspace-public-apis'] = new URL('../src/workspace-public-apis.ts', import.meta.url).pathname;
    return config;
  },
  async redirects() {
    return [
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
