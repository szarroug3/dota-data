import path from "path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.dotabuff.com",
        port: "",
        pathname: "/favicon.ico",
      },
      {
        protocol: "https",
        hostname: "www.opendota.com",
        port: "",
        pathname: "/assets/images/icons/icon-72x72.png",
      },
    ],
  },
  webpack: (config, { dev }) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname, 'src'),
    };
    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions || {}),
        ignored: [
          ...(Array.isArray(config.watchOptions?.ignored)
            ? config.watchOptions.ignored
            : typeof config.watchOptions?.ignored === 'string'
              ? [config.watchOptions.ignored]
              : []),
          'mock-data/**',
        ].filter(v => typeof v === 'string' && v.length > 0),
      };
    }
    return config;
  },
};

export default nextConfig;
