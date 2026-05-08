/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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
