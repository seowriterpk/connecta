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
  // WWW → APEX 301 (GSC "Alternative page with proper canonical tag", 2026-10):
  // canonical tags already consolidate www duplicates to the apex, but Google
  // keeps RE-CRAWLING www URLs because they serve 200 — the Page-indexing
  // report never drains (45 URLs stuck since Jul 2026). A 301 drains it and
  // consolidates link equity + crawl budget on https://gruposhoy.com.
  // Notes:
  //   · `has.type:"host"` strips the port and lowercases before matching;
  //     the value is an ANCHORED REGEX, hence the escaped dots.
  //   · Next.js routing order: headers → redirects → middleware (proxy.ts) →
  //     beforeFiles rewrites → filesystem. So this fires FIRST —
  //     www.gruposhoy.com/sitemap.xml 301s to the apex too.
  //   · Requires the reverse proxy (hPanel) to forward the original Host
  //     header to the Node server (default behavior). If www URLs still
  //     serve 200 after deploy, check the hPanel proxy config.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", key: "host", value: "www\\.gruposhoy\\.com" }],
        destination: "https://gruposhoy.com/:path*",
        statusCode: 301,
      },
    ];
  },
  // SITEMAP INDEX (Task 35): /sitemap.xml is served by the internal API
  // route /api/sitemap-index, which reads the generated file from disk per
  // request. Why not the public/ folder: Next.js 16 scans public/ only ONCE
  // at boot, so runtime-regenerated files 404'd on the static path (the
  // grupos-N.xml 404 bug). `beforeFiles` runs BEFORE the public-folder
  // check, so this rewrite wins deterministically in dev AND prod — and it
  // avoids Next's dev-mode "conflicting public file and page file" 500 that
  // a literal app/sitemap.xml route would hit whenever a generated
  // public/sitemap.xml exists on disk.
  async rewrites() {
    return {
      beforeFiles: [{ source: "/sitemap.xml", destination: "/api/sitemap-index" }],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
