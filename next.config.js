/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  experimental: {
    // Native modules and server-only packages must not be bundled by webpack
    serverComponentsExternalPackages: ['better-sqlite3', 'nodemailer'],
    instrumentationHook: true,
  },
};

module.exports = nextConfig;
