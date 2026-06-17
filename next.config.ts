import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // serverExternalPackages: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
  // webpack: (config) => {
  //   config.resolve.alias = {
  //     ...config.resolve.alias,
  //     "@ffmpeg/ffmpeg": require.resolve("@ffmpeg/ffmpeg"),
  //   };
  //   return config;
  // },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS, HEAD, POST, PUT, DELETE" },
          { key: "Access-Control-Allow-Headers", value: "*" },
        ],
      },
    ];
  },
  // experimental: {
  //   dynamicIO: true
  // }
};

export default nextConfig;
