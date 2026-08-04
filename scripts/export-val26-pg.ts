import { PrismaClient } from "@prisma/client";

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("❌ ERREUR SÉCURITÉ CRITIQUE : La variable d'environnement DATABASE_URL n'est pas définie !");
  console.error("   Le script refuse d'exécuter toute requête sans DATABASE_URL fournie par l'environnement.");
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

async function main() {
  const valUsers = await prisma.user.findMany({
    where: {
      employeeId: {
        startsWith: "VAL26-",
      },
    },
    include: {
      payrolls: {
        orderBy: { month: "asc" },
      },
      leaveLedgerEntries: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: {
      employeeId: "asc",
    },
  });

  console.log(JSON.stringify(valUsers, null, 2));
}

main()
  .catch((e) => {
    console.error("❌ Erreur d'exécution de l'export PostgreSQL:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
