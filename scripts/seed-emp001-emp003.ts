import { prisma } from "../lib/db";

async function seedEmployees() {
  console.log("🌱 Initialisation des salariés de référence (EMP-001 & EMP-003)...");

  const companies = await prisma.company.findMany({ select: { id: true, name: true } });
  if (companies.length === 0) {
    console.log("⚠️ Aucune entreprise trouvée.");
    return;
  }

  for (const company of companies) {
    console.log(` ➜ Entreprise : ${company.name} (${company.id})`);

    // EMP-001
    await prisma.user.upsert({
      where: {
        email: `emp001_${company.id}@progitpaie.local`,
      },
      update: {
        name: "Kouassi Jean",
        employeeId: "EMP-001",
        salary: 350000,
        sursalaire: 50000,
        transportAllowance: 30000,
        partsIGR: 2.0,
        contractType: "CDI",
        category: "5B",
        jobTitle: "Responsable RH",
        direction: "ADMINISTRATION",
        service: "RESSOURCES HUMAINES",
        role: "employee",
        isActive: true,
      },
      create: {
        companyId: company.id,
        name: "Kouassi Jean",
        email: `emp001_${company.id}@progitpaie.local`,
        password: "$2a$10$UnmanagedPasswordPlaceholderHashToSatisfySchemaConstraint",
        employeeId: "EMP-001",
        salary: 350000,
        sursalaire: 50000,
        transportAllowance: 30000,
        partsIGR: 2.0,
        contractType: "CDI",
        category: "5B",
        jobTitle: "Responsable RH",
        direction: "ADMINISTRATION",
        service: "RESSOURCES HUMAINES",
        role: "employee",
        isActive: true,
      },
    });

    // EMP-003
    await prisma.user.upsert({
      where: {
        email: `emp003_${company.id}@progitpaie.local`,
      },
      update: {
        name: "KOUAME Marc",
        employeeId: "EMP-003",
        salary: 300000,
        sursalaire: 40000,
        transportAllowance: 30000,
        partsIGR: 1.5,
        contractType: "CDI",
        category: "4A",
        jobTitle: "Développeur Sénior",
        direction: "INFORMATIQUE",
        service: "DEVELOPPEMENT",
        role: "employee",
        isActive: true,
      },
      create: {
        companyId: company.id,
        name: "KOUAME Marc",
        email: `emp003_${company.id}@progitpaie.local`,
        password: "$2a$10$UnmanagedPasswordPlaceholderHashToSatisfySchemaConstraint",
        employeeId: "EMP-003",
        salary: 300000,
        sursalaire: 40000,
        transportAllowance: 30000,
        partsIGR: 1.5,
        contractType: "CDI",
        category: "4A",
        jobTitle: "Développeur Sénior",
        direction: "INFORMATIQUE",
        service: "DEVELOPPEMENT",
        role: "employee",
        isActive: true,
      },
    });

    console.log(` ✅ EMP-001 (Kouassi Jean) et EMP-003 (KOUAME Marc) configurés pour ${company.name}`);
  }

  console.log("✨ Initialisation des salariés de référence terminée avec succès !");
}

seedEmployees()
  .catch((err) => {
    console.error("❌ Erreur lors du seeding des salariés :", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
