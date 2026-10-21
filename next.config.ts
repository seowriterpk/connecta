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
  // SEO policy: WhatsApp-sourced group images must NEVER be indexed —
  // robots.txt blocks /media/ and /uploads/, these headers are defense in
  // depth for every image response (incl. the media route + legacy uploads).
  async headers() {
    return [
      {
        source: "/media/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, noimageindex, nosnippet, noarchive" },
        ],
      },
      {
        source: "/uploads/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, noimageindex, nosnippet, noarchive" },
        ],
      },
    ];
  },
};

export default nextConfig;
