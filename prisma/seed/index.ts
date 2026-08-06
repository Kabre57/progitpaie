import { PrismaClient } from "@prisma/client";
import { seedCompany } from "./factories/company.factory";
import { seedAdmin } from "./factories/user.factory";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting modular Prisma seeding...");
  const company = await seedCompany(prisma);
  await seedAdmin(prisma, company.id);
  console.log("🚀 Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
