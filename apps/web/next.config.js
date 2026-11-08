const createNextIntlPlugin = require('next-intl/plugin');
const path = require('path');

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@barcelona/shared'],
  images: {
    domains: ['images.unsplash.com', 'localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config) => {
    // Resolve symlinked packages in npm workspaces correctly on Windows
    config.resolve.symlinks = false;
    config.resolve.alias = {
      ...config.resolve.alias,
      '@barcelona/shared': path.resolve(__dirname, '../../packages/shared/dist/index.js'),
    };
    return config;
  },
};

module.exports = withNextIntl(nextConfig);
