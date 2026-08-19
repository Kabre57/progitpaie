import "dotenv/config";
import { prisma } from "../lib/db";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedCompany } from "../prisma/seed/factories/company.factory";

async function main() {
  const email = (process.env.SEED_SUPER_ADMIN_EMAIL || "superadmin@progitpaie.online").trim().toLowerCase();
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD || "SuperAdmin2026!";
  const name = process.env.SEED_SUPER_ADMIN_NAME || "Super Administrateur PROGITPAIE";

  if (password.length < 12) {
    throw new Error("Le mot de passe doit contenir au moins 12 caractères.");
  }

  console.log(`🔐 Configuration du compte Super-Admin pour : ${email}...`);

  const company = await seedCompany(prisma);
  const existingUser = await prisma.user.findFirst({
    where: { email },
  });

  const hashedPassword = await bcrypt.hash(password, 12);

  if (existingUser) {
    const updated = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        role: UserRole.super_admin,
        password: hashedPassword,
        isActive: true,
      },
    });
    console.log(`✅ Utilisateur existant mis à jour avec le rôle 'super_admin' : ${updated.email}`);
  } else {
    const created = await prisma.user.create({
      data: {
        companyId: company.id,
        name,
        email,
        password: hashedPassword,
        role: UserRole.super_admin,
        mustChangePassword: false,
        isActive: true,
        leaveBalanceAnnual: 30,
        leaveBalanceSick: 15,
        leaveBalanceCasual: 10,
      },
    });
    console.log(`✅ Compte Super-Admin créé avec succès : ${created.email}`);
  }

  console.log("--------------------------------------------------");
  console.log("🚀 Identifiants Super-Admin opérationnels :");
  console.log(`   Email    : ${email}`);
  console.log(`   Rôle     : super_admin`);
  console.log("   Redirection automatique : /super-admin/dashboard");
  console.log("--------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors de la configuration du Super-Admin :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
