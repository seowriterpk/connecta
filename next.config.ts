import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Hide X-Powered-By (tiny CPU/bytes win + security hygiene).
  poweredByHeader: false,
  allowedDevOrigins: ["*.space-z.ai", "*.chatglm.cn", "127.0.0.1", "localhost", "21.0.12.133", "21.0.10.180"],
  // Dev-mode memory relief: the 4GB sandbox cgroup OOM-kills webpack dev
  // when many routes compile at once. This flag trades compile speed for
  // a much lower heap footprint.
  experimental: {
    webpackMemoryOptimizations: true,
    // BUILD CRASH FIX (Hostinger, low-end server): the VPS exposes the host's
    // full CPU set (~64 cores) to the kernel, so `next build` spawned
    // "Collecting page data using 63 workers" and hit the container's
    // thread/pids limit -> Rust/Tokio "can't spawn worker thread:
    // Resource temporarily unavailable (os error 11)" -> SIGABRT.
    // `cpus` caps the number of build workers so a cheap server can never
    // spawn more threads than it is allowed to have. Build takes a bit
    // longer; runtime is NOT affected (verified in Next 16.1.3 locally and
    // 16.3.8 / 16.4.2 via unpkg — the flag exists in all of them).
    cpus: 2,
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
