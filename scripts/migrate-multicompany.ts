import { prisma } from "../lib/db";
import { CompanyRepository } from "../lib/infrastructure/repositories/company-repository";

async function migrateToMulticompany() {
  console.log("🚀 Démarrage de la migration Multicompany...");

  const companyRepo = new CompanyRepository();
  const mainCompany = await companyRepo.findMainCompany();

  console.log(`🏢 Entité principale identifiée : [${mainCompany.id}] ${mainCompany.name}`);

  // 1. Rattachement des utilisateurs sans companyId
  const usersWithoutCompany = await prisma.user.count({
    where: { companyId: null },
  });

  if (usersWithoutCompany > 0) {
    const updatedUsers = await prisma.user.updateMany({
      where: { companyId: null },
      data: { companyId: mainCompany.id },
    });
    console.log(`✅ ${updatedUsers.count} employés rattachés à l'entreprise [${mainCompany.name}]`);
  } else {
    console.log("ℹ️ Tous les employés ont déjà une entreprise rattachée.");
  }

  console.log("🎉 Migration Multicompany terminée avec succès !");
}

migrateToMulticompany()
  .catch((err) => {
    console.error("❌ Erreur de migration :", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
