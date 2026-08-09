import { prisma } from "../lib/db";

const KEPT_EMPLOYEE_IDS = ["EMP-000", "EMP-001", "EMP-003"];

async function cleanupData() {
  console.log("🧹 Démarrage du nettoyage des données salariés & modules RH...");
  console.log(`📌 Conservation stricte des salariés : ${KEPT_EMPLOYEE_IDS.join(", ")} ainsi que des comptes Administrateurs.`);

  // 1. Récupération des IDs des salariés autorisés à être conservés
  const keptUsers = await prisma.user.findMany({
    where: {
      OR: [
        { employeeId: { in: KEPT_EMPLOYEE_IDS } },
        { role: "admin" },
        { role: "super_admin" },
      ],
      // Exclure explicitement tout compte de staging / test de provision créé dynamiquement
      NOT: [
        { employeeId: { startsWith: "STAGING-" } },
        { employeeId: { startsWith: "VAL26-" } },
      ],
    },
    select: { id: true, employeeId: true, name: true, role: true },
  });

  const keptUserIds = keptUsers.map((u) => u.id);
  console.log(`✅ Salariés & Admins conservés (${keptUsers.length}) :`, keptUsers.map(u => `${u.name} (${u.employeeId || u.role})`).join(", "));

  // 2. Identification des utilisateurs à supprimer
  const usersToDelete = await prisma.user.findMany({
    where: {
      id: { notIn: keptUserIds },
    },
    select: { id: true, employeeId: true, name: true, role: true },
  });

  const userIdsToDelete = usersToDelete.map((u) => u.id);
  console.log(`🗑️ Nombre d'utilisateurs/salariés à supprimer : ${usersToDelete.length}`);

  // 3. Suppressions en cascade explicites sur toutes les tables de tous les modules RH & Paie
  
  // Congés & Absences
  const deletedLeaves = await prisma.leave.deleteMany({
    where: {
      OR: [
        { userId: { notIn: keptUserIds } },
        { userId: { in: userIdsToDelete } },
      ],
    },
  });
  console.log(` - Congés & Absences supprimés : ${deletedLeaves.count}`);

  const deletedLedger = await prisma.leaveLedgerEntry.deleteMany({
    where: {
      OR: [
        { userId: { notIn: keptUserIds } },
        { userId: { in: userIdsToDelete } },
      ],
    },
  });
  console.log(` - Entrées du registre de congés supprimées : ${deletedLedger.count}`);

  // Pointages & Présences
  const deletedAttendance = await prisma.attendance.deleteMany({
    where: {
      OR: [
        { userId: { notIn: keptUserIds } },
        { userId: { in: userIdsToDelete } },
      ],
    },
  });
  console.log(` - Pointages & Présences supprimés : ${deletedAttendance.count}`);

  // Heures Supplémentaires
  const deletedOvertime = await prisma.overtime.deleteMany({
    where: {
      OR: [
        { userId: { notIn: keptUserIds } },
        { userId: { in: userIdsToDelete } },
      ],
    },
  });
  console.log(` - Heures Supplémentaires supprimées : ${deletedOvertime.count}`);

  // Contrats RH
  const deletedContracts = await prisma.contract.deleteMany({
    where: {
      OR: [
        { userId: { notIn: keptUserIds } },
        { userId: { in: userIdsToDelete } },
      ],
    },
  });
  console.log(` - Contrats RH supprimés : ${deletedContracts.count}`);

  // Lignes de primes / déductions de Paie
  const deletedPayrollEarningLines = await prisma.payrollEarningLine.deleteMany({
    where: {
      OR: [
        { userId: { notIn: keptUserIds } },
        { userId: { in: userIdsToDelete } },
      ],
    },
  });
  console.log(` - Lignes de gains/retenues de paie supprimées : ${deletedPayrollEarningLines.count}`);

  // Bulletins de Paie
  const deletedPayrolls = await prisma.payroll.deleteMany({
    where: {
      OR: [
        { userId: { notIn: keptUserIds } },
        { userId: { in: userIdsToDelete } },
      ],
    },
  });
  console.log(` - Bulletins de Paie supprimés : ${deletedPayrolls.count}`);

  // Ecritures comptables
  const deletedAccountingEntries = await prisma.accountingEntry.deleteMany({
    where: {
      OR: [
        { userId: { notIn: keptUserIds } },
        { userId: { in: userIdsToDelete } },
      ],
    },
  });
  console.log(` - Écritures comptables supprimées : ${deletedAccountingEntries.count}`);

  // Prêts & Avances
  const deletedLoans = await prisma.loan.deleteMany({
    where: {
      OR: [
        { userId: { notIn: keptUserIds } },
        { userId: { in: userIdsToDelete } },
      ],
    },
  });
  console.log(` - Prêts & Avances supprimés : ${deletedLoans.count}`);

  // Solde Tout Compte / Indemnités de rupture
  const deletedSeverances = await prisma.severance.deleteMany({
    where: {
      OR: [
        { userId: { notIn: keptUserIds } },
        { userId: { in: userIdsToDelete } },
      ],
    },
  });
  console.log(` - Soldes tout compte supprimés : ${deletedSeverances.count}`);

  // Instantanés des calculs de provisions
  const deletedProvisionSnapshots = await prisma.provisionCalculationSnapshot.deleteMany({
    where: {
      companyId: { notIn: [] }, // Nettoyage si des données orphelines subsistent
    },
  });
  console.log(` - Instantanés de calcul des provisions réinitialisés : ${deletedProvisionSnapshots.count}`);

  // 4. Suppression finale des comptes Salariés hors EMP-000, EMP-001, EMP-003
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      id: { in: userIdsToDelete },
    },
  });
  console.log(`✨ Suppression finale des ${deletedUsers.count} comptes salariés non conservés effectuée avec succès !`);
}

cleanupData()
  .catch((err) => {
    console.error("❌ Erreur lors du nettoyage des données salariés :", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
