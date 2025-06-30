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
};

export default nextConfig;
