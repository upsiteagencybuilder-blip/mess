#!/bin/bash
# Vercel build script — runs before `next build`.
# Swaps Prisma schema from SQLite (local dev) to PostgreSQL (production),
# generates Prisma client, and pushes schema to the database.

set -e

echo "=== Vercel Build: Preparing Prisma for PostgreSQL ==="

# Backup the CURRENT schema (SQLite for local dev) before swapping
cp prisma/schema.prisma prisma/schema.prisma.dev.bak

# Swap schema to PostgreSQL for production
cp prisma/schema.prod.prisma prisma/schema.prisma

echo "✓ Switched schema to PostgreSQL"

# Generate Prisma client
npx prisma generate
echo "✓ Prisma client generated"

# Push schema to database (creates tables if they don't exist)
if [[ "$DATABASE_URL" == postgresql://* ]]; then
  echo "✓ DATABASE_URL is PostgreSQL, pushing schema..."
  npx prisma db push --accept-data-loss
  echo "✓ Schema pushed to database"

  # Run seed if SEED_DB is set to "true"
  if [[ "$SEED_DB" == "true" ]]; then
    echo "✓ SEED_DB=true, seeding database..."
    npx tsx prisma/seed.ts || echo "⚠ Seed skipped (may already have data)"
  fi
else
  echo "⚠ DATABASE_URL is not a PostgreSQL URL, skipping db push"
  echo "  Set DATABASE_URL in Vercel Environment Variables"
fi

# Restore the dev schema (SQLite) for git cleanliness
mv prisma/schema.prisma.dev.bak prisma/schema.prisma

echo "=== Build preparation complete ==="
