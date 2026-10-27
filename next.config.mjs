// NOTE: This file is deliberately `next.config.mjs` (plain ESM JavaScript) — NOT `.ts`.
// The production host (shared hosting) runs an older glibc that cannot load the
// native SWC binary. With a `.ts` config, Next.js must transpile the config via
// SWC into a temp "<hash>.next.config" file and import it from
// `next.config.compiled.js` — that step fails on the host
// (ERR_MODULE_NOT_FOUND). A plain `.mjs` config is loaded directly with zero
// transpilation, so `next build` works on any Linux, old or new.

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
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
    // longer; runtime is NOT affected.
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
