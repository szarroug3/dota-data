import path from 'path';

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.opendota.com',
        port: '',
        pathname: '/assets/images/icons/icon-72x72.png',
      },
      {
        protocol: 'https',
        hostname: 'dota2protracker.com',
        port: '',
        pathname: '/static/heroes/*',
      },
      {
        protocol: 'https',
        hostname: 'cdn.cloudflare.steamstatic.com',
        port: '',
        pathname: '/apps/dota2/images/dota_react/items/*',
      },
    ],
  },
  // Turbopack configuration (Next.js 16+ uses Turbopack by default)
  turbopack: {
    resolveAlias: {
      // Path alias for @ imports (also configured in tsconfig.json)
      '@': path.resolve(__dirname, 'src'),
    },
    // Turbopack automatically ignores common patterns
    // For custom ignore patterns, we can configure them here if needed
  },
};

export default nextConfig;
