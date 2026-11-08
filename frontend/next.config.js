const createNextIntlPlugin = require('next-intl/plugin');
const path = require('path');

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
    config.resolve.alias = {
      ...config.resolve.alias,
      '@barcelona/shared': path.resolve(__dirname, './src/shared/index.ts'),
    };
    return config;
  },
};

module.exports = withNextIntl(nextConfig);

