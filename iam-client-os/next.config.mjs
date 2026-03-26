/** @type {import('next').NextConfig} */
const nextConfig = {
  // Include memory/ in serverless bundle so MCP tools can read it
  outputFileTracingIncludes: {
    '/api/mcp': ['./memory/**/*'],
  },
  env: {
    NEXT_PUBLIC_CLIENT_NAME: process.env.NEXT_PUBLIC_CLIENT_NAME || 'Your Business',
    NEXT_PUBLIC_CLIENT_DOMAIN: process.env.NEXT_PUBLIC_CLIENT_DOMAIN || '',
  },
  async rewrites() {
    return [
      {
        source: '/.well-known/oauth-authorization-server',
        destination: '/api/oauth-metadata',
      },
      {
        source: '/.well-known/oauth-authorization-server/:path*',
        destination: '/api/oauth-metadata',
      },
    ];
  },
};

export default nextConfig;
