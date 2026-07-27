import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existingAdmin = await prisma.user.findFirst({
    where: { role: UserRole.admin },
  });

  if (existingAdmin) {
    console.log("Admin user already exists:", existingAdmin.email);
    return;
  }

  const hashedPassword = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.create({
    data: {
      name: "System Administrator",
      email: "admin@attendance.com",
      password: hashedPassword,
      role: UserRole.admin,
      employeeId: "EMP-001",
      leaveBalanceAnnual: 20,
      leaveBalanceSick: 10,
      leaveBalanceCasual: 5,
    },
  });

  console.log("✅ Default admin seeded successfully:", admin.email);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
