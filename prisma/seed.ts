import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.upsert({
    where: { id: "progitpaie-default-001" },
    update: { name: "PROGITPAIE", isMain: true, isActive: true },
    create: { id: "progitpaie-default-001", name: "PROGITPAIE", isMain: true, isActive: true },
  });
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME?.trim() || "Administrateur PROGITPAIE";

  if (!email || !password) {
    throw new Error(
      "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required to seed the first administrator"
    );
  }

  if (password.length < 12) {
    throw new Error("SEED_ADMIN_PASSWORD must contain at least 12 characters");
  }

  const existingAdmin = await prisma.user.findFirst({
    where: { role: UserRole.admin },
  });

  if (existingAdmin) {
    console.log("Admin user already exists:", existingAdmin.email);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const admin = await prisma.user.create({
    data: {
      companyId: company.id,
      name,
      email,
      password: hashedPassword,
      role: UserRole.admin,
      employeeId: "EMP-001",
      leaveBalanceAnnual: 20,
      leaveBalanceSick: 10,
      leaveBalanceCasual: 5,
    },
  });

  console.log("✅ First administrator seeded successfully:", admin.email);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
