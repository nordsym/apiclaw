/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async redirects() {
    return [
      {
        source: '/docs',
        destination: '/workspace?tab=docs',
        permanent: false,
      },
      {
        source: '/faq',
        destination: '/#faq',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
