import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixDuplicateMatricules() {
  console.log("🔧 DÉBOGAGE ET CORRECTION DES MATRICULES ET RÔLES (ADMIN vs SALARIÉS)...");

  // 1. Définir employeeId = null pour TOUS les administrateurs (admin & super_admin)
  const updatedAdmins = await prisma.user.updateMany({
    where: {
      role: { in: ["admin", "super_admin"] },
    },
    data: {
      employeeId: null,
    },
  });

  console.log(`✅ ${updatedAdmins.count} comptes Administrateurs mis à jour avec employeeId = null (masqués du registre des salariés).`);

  // 2. Numérotation séquentielle unique EMP-001, EMP-002, EMP-003... pour les vrais salariés
  const companies = await prisma.company.findMany({ select: { id: true, name: true } });

  for (const company of companies) {
    const employees = await prisma.user.findMany({
      where: {
        companyId: company.id,
        role: "employee",
      },
      orderBy: { createdAt: "asc" },
    });

    console.log(` 🏢 Entreprise ${company.name} : ${employees.length} salarié(s) à vérifier/numéroter.`);

    let index = 1;
    for (const emp of employees) {
      const nextMatricule = `EMP-${String(index).padStart(3, "0")}`;
      await prisma.user.update({
        where: { id: emp.id },
        data: { employeeId: nextMatricule },
      });
      console.log(`   ➜ [${emp.name}] matricule fixé à ${nextMatricule}`);
      index++;
    }
  }

  console.log("✨ Correction des matricules terminée avec succès !");
}

fixDuplicateMatricules()
  .catch((err) => {
    console.error("❌ Erreur lors de la correction des matricules :", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
