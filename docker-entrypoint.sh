#!/bin/sh
set -e

echo "Starting deployment checks..."

# Apply checked-in migrations. The preparation script safely baselines databases
# created by older releases that used `prisma db push`.
echo "Preparing database..."
node prisma/prepare-database.mjs

# Run the seed to make sure admin account and public ID counter exists
echo "Running Prisma DB Seed..."
npx tsx prisma/seed.ts

echo "Starting Next.js..."
exec "$@"
