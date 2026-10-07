import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ["*.space-z.ai", "*.chatglm.cn", "127.0.0.1", "localhost", "21.0.12.133"],
  // Dev-mode memory relief: the 4GB sandbox cgroup OOM-kills webpack dev
  // when many routes compile at once. This flag trades compile speed for
  // a much lower heap footprint.
  experimental: {
    webpackMemoryOptimizations: true,
  },
};

export default nextConfig;
