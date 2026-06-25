import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminUsername = "admin";
  const adminPassword = "admin123";

  // Check if admin exists
  const existingAdmin = await prisma.admin.findUnique({
    where: { username: adminUsername },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.admin.create({
      data: {
        username: adminUsername,
        password: hashedPassword,
      },
    });
    console.log("Admin account created successfully.");
  } else {
    console.log("Admin account already exists.");
  }

  // Initialize PublicIdCounter if not exists
  const currentYear = new Date().getFullYear();
  const existingCounter = await prisma.publicIdCounter.findUnique({
    where: { id: "counter" },
  });

  if (!existingCounter) {
    await prisma.publicIdCounter.create({
      data: {
        id: "counter",
        year: currentYear,
        counter: 0,
      },
    });
    console.log("Public ID Counter initialized.");
  } else {
    console.log("Public ID Counter already exists.");
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
