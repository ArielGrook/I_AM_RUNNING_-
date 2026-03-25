/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_CLIENT_NAME: process.env.NEXT_PUBLIC_CLIENT_NAME || 'Your Business',
    NEXT_PUBLIC_CLIENT_DOMAIN: process.env.NEXT_PUBLIC_CLIENT_DOMAIN || '',
  },
};

export default nextConfig;
