/**
 * PostCSS configuration for Tailwind CSS v4.
 *
 * IMPORTANT (Next.js 16 + Turbopack compatibility):
 *  - Use the OBJECT form for `plugins`, NOT an array of strings.
 *    The array form causes Turbopack's CSS worker to crash during build/dev.
 *    See: https://github.com/vercel/next.js/discussions/90034
 *  - Use `@tailwindcss/postcss` v4 (NOT the v3 `tailwindcss` plugin).
 *  - Do NOT add `autoprefixer`: Tailwind v4 ships its own prefixing.
 *  - All theme config lives in src/app/globals.css via `@theme inline { ... }`
 *    (no tailwind.config.ts is used; v4 auto-detects content sources).
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
