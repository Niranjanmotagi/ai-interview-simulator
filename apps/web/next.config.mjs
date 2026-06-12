/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output is for the Docker image; on Vercel the platform
  // provides its own serverless output mode.
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  transpilePackages: ['@ai-interview/types'],
  async rewrites() {
    // Proxying /api/v1/* through Next keeps the refresh cookie same-origin in
    // every environment (dev and prod) — no third-party-cookie headaches.
    // Set API_PROXY_TARGET to the Render API URL in production.
    const target = process.env.API_PROXY_TARGET ?? 'http://localhost:4000';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${target}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
