import { prisma } from "../lib/db";

const KEPT_EMPLOYEE_IDS = ["EMP-000", "EMP-001", "EMP-003"];

async function cleanupData() {
  console.log("🧹 Démarrage du nettoyage des données salariés & modules RH...");
  console.log(`📌 Conservation stricte des salariés : ${KEPT_EMPLOYEE_IDS.join(", ")} ainsi que des comptes Administrateurs.`);

  // 1. Récupération de la liste complète des utilisateurs
  const allUsers = await prisma.user.findMany({
    select: { id: true, employeeId: true, name: true, email: true, role: true, companyId: true },
  });

  const keptUsers = allUsers.filter((u) => {
    if (u.employeeId && KEPT_EMPLOYEE_IDS.includes(u.employeeId.trim())) return true;
    if (u.role === "admin" || u.role === "super_admin") {
      if (u.employeeId && (u.employeeId.startsWith("STAGING-") || u.employeeId.startsWith("VAL26-"))) {
        return false;
      }
      return true;
    }
    return false;
  });

  const keptUserIds = new Set(keptUsers.map((u) => u.id));
  const usersToDelete = allUsers.filter((u) => !keptUserIds.has(u.id));
  const userIdsToDelete = usersToDelete.map((u) => u.id);

  console.log(`✅ Utilisateurs conservés (${keptUsers.length}) :`, keptUsers.map((u) => `${u.name} (${u.employeeId || u.role})`).join(", "));
  console.log(`🗑️ Nombre d'utilisateurs/salariés à supprimer : ${usersToDelete.length}`);

  if (userIdsToDelete.length > 0) {
    console.log(" ➜ Suppression des utilisateurs non conservés :", usersToDelete.map((u) => `${u.name} (${u.employeeId || u.role})`).join(", "));
  }

  // 2. Suppressions des enregistrements RH associés aux salariés non conservés

  // Congés & Absences
  const deletedLeaves = await prisma.leave.deleteMany({
    where: { userId: { in: userIdsToDelete } },
  });
  console.log(` - Congés & Absences supprimés : ${deletedLeaves.count}`);

  const deletedLedger = await prisma.leaveLedgerEntry.deleteMany({
    where: { userId: { in: userIdsToDelete } },
  });
  console.log(` - Entrées du registre de congés supprimées : ${deletedLedger.count}`);

  // Pointages & Présences
  const deletedAttendance = await prisma.attendance.deleteMany({
    where: { userId: { in: userIdsToDelete } },
  });
  console.log(` - Pointages & Présences supprimés : ${deletedAttendance.count}`);

  // Heures Supplémentaires
  const deletedOvertime = await prisma.overtime.deleteMany({
    where: { userId: { in: userIdsToDelete } },
  });
  console.log(` - Heures Supplémentaires supprimées : ${deletedOvertime.count}`);

  // Contrats RH
  const deletedContracts = await prisma.contract.deleteMany({
    where: { userId: { in: userIdsToDelete } },
  });
  console.log(` - Contrats RH supprimés : ${deletedContracts.count}`);

  // Bulletins de Paie (Supprimer aussi les bulletins résiduels générés sur des comptes administrateurs)
  const deletedPayrolls = await prisma.payroll.deleteMany({
    where: {
      OR: [
        { userId: { in: userIdsToDelete } },
        { user: { role: { not: "employee" } } },
        { user: { employeeId: null } },
      ],
    },
  });
  console.log(` - Bulletins de Paie supprimés : ${deletedPayrolls.count}`);

  // Prêts & Avances
  const deletedLoans = await prisma.loan.deleteMany({
    where: { userId: { in: userIdsToDelete } },
  });
  console.log(` - Prêts & Avances supprimés : ${deletedLoans.count}`);

  // Solde Tout Compte / Indemnités de rupture
  const deletedSeverances = await prisma.severance.deleteMany({
    where: { userId: { in: userIdsToDelete } },
  });
  console.log(` - Soldes tout compte supprimés : ${deletedSeverances.count}`);

  // Instantanés des calculs de provisions
  const deletedProvisionSnapshots = await prisma.provisionCalculationSnapshot.deleteMany({});
  console.log(` - Instantanés de calcul des provisions réinitialisés : ${deletedProvisionSnapshots.count}`);

  // 3. Suppression finale des comptes utilisateurs non conservés
  if (userIdsToDelete.length > 0) {
    const deletedUsers = await prisma.user.deleteMany({
      where: { id: { in: userIdsToDelete } },
    });
    console.log(`✨ Suppression finale des ${deletedUsers.count} comptes salariés non conservés effectuée avec succès !`);
  } else {
    console.log("✨ Aucun compte salarié supplémentaire à supprimer.");
  }
}

cleanupData()
  .catch((err) => {
    console.error("❌ Erreur lors du nettoyage des données salariés :", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
