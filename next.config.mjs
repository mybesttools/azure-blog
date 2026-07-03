/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '*.azurewebsites.net',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
      {
        protocol: 'https',
        hostname: 'www.mybesttools.com',
      },
      {
        protocol: 'https',
        hostname: 'mybesttools.com',
      },
    ],
  },
  output: 'standalone',
};

export default nextConfig;
