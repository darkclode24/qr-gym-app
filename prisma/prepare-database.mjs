import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const schemaPath = "prisma/schema.prisma";
const baselineMigration = "20260623073209_init";
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

function runPrisma(args, acceptedExitCodes = [0]) {
  const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
  const result = spawnSync(npxCommand, ["prisma", ...args], {
    env: process.env,
    shell: process.platform === "win32",
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (!acceptedExitCodes.includes(result.status ?? 1)) {
    throw new Error(`Prisma command failed: prisma ${args.join(" ")}`);
  }

  return result.status;
}

async function getUserTables() {
  const prisma = new PrismaClient();

  try {
    const rows = await prisma.$queryRawUnsafe(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
    );
    return rows.map((row) => row.name);
  } finally {
    await prisma.$disconnect();
  }
}

async function isMigrationApplied(migrationName) {
  const prisma = new PrismaClient();

  try {
    const tables = await prisma.$queryRawUnsafe(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = '_prisma_migrations'",
    );
    if (tables.length === 0) {
      return false;
    }

    const rows = await prisma.$queryRawUnsafe(
      "SELECT migration_name FROM _prisma_migrations WHERE migration_name = ? AND finished_at IS NOT NULL AND rolled_back_at IS NULL",
      migrationName,
    );
    return rows.length > 0;
  } finally {
    await prisma.$disconnect();
  }
}

const tables = await getUserTables();

if (tables.includes("_prisma_migrations") || tables.length === 0) {
  runPrisma(["migrate", "deploy", "--schema", schemaPath]);
} else {
  console.log("Existing pre-migration database detected. Verifying schema...");

  const diffStatus = runPrisma(
    [
      "migrate",
      "diff",
      "--exit-code",
      "--from-schema-datasource",
      schemaPath,
      "--to-schema-datamodel",
      schemaPath,
    ],
    [0, 2],
  );

  if (diffStatus === 2) {
    throw new Error(
      "Existing database schema does not match the initial migration. No database changes were made.",
    );
  }

  console.log(`Recording safe baseline migration ${baselineMigration}...`);
  if (!(await isMigrationApplied(baselineMigration))) {
    runPrisma([
      "migrate",
      "resolve",
      "--applied",
      baselineMigration,
      "--schema",
      schemaPath,
    ]);
  }
  runPrisma(["migrate", "deploy", "--schema", schemaPath]);
}
