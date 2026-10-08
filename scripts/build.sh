#!/bin/bash
# Production build script for Hostinger deployment.
#
# This script handles TWO problems that crash the build on Hostinger:
#
# 1. Prisma provider must be "mysql" in production (local dev uses "sqlite").
#    The schema.prisma in the repo is set to sqlite for local dev. This script
#    swaps it to mysql before `prisma generate` so the generated Prisma client
#    targets MySQL (not SQLite). The swap is non-destructive — it only modifies
#    the file in the build environment, not the source repo.
#
# 2. No database access during build. Hostinger's build environment has no
#    DATABASE_URL and no MySQL connection. All pages are `force-dynamic` so
#    Next.js renders them at runtime (when a user visits), NOT at build time.
#    This means the build never queries the DB.
#
set -e

cd "$(dirname "$0")/.."

echo "[build] Step 1/4: Switch Prisma provider to MySQL..."
# Swap sqlite → mysql in schema.prisma (idempotent — safe if already mysql)
if grep -q 'provider = "sqlite"' prisma/schema.prisma; then
  sed -i 's/provider = "sqlite"/provider = "mysql"/' prisma/schema.prisma
  echo "  ✓ Switched provider sqlite → mysql"
else
  echo "  ✓ Provider already mysql (no change needed)"
fi

echo "[build] Step 2/4: Generate Prisma client (MySQL)..."
# prisma generate only reads the schema — no DB connection needed
npx prisma generate
echo "  ✓ Prisma client generated"

echo "[build] Step 3/4: Build with webpack (Turbopack crashes on CSS in prod)..."
# --webpack avoids the Turbopack PostCSS worker crash (Next 16.3.x bug)
# All pages are force-dynamic, so no DB queries happen during build
npx next build --webpack
echo "  ✓ Build complete"

echo "[build] Step 4/4: Copy static assets to standalone output..."
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/
echo "  ✓ Assets copied"

echo "[build] All steps complete!"
