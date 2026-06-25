#!/bin/sh
set -e

echo "Starting deployment checks..."

# Ensure the database structure is up to date (this creates the DB if it doesn't exist)
echo "Running Prisma DB Push..."
npx prisma db push --accept-data-loss

# Run the seed to make sure admin account and public ID counter exists
echo "Running Prisma DB Seed..."
npx tsx prisma/seed.ts

echo "Starting Next.js..."
exec "$@"
