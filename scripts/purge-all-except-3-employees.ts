import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const KEPT_EMPLOYEE_IDS = ["EMP-000", "EMP-001", "EMP-003"];
const KEPT_ADMIN_EMAILS = [
  "admin@attendance.com",
  "theogeoffroy5@gmail.com",
  "parabellumgroups@gmail.com",
];

async function purgeAllExceptThree() {
  console.log("🧹 EXÉCUTION DE LA PURGE ABSOLUE DES 135 SALARIÉS...");
  console.log("📌 Salariés conservés uniquement : EMP-000, EMP-001, EMP-003");

  const allUsers = await prisma.user.findMany({
    select: { id: true, employeeId: true, name: true, email: true, role: true, companyId: true },
  });

  console.log(`📊 Nombre total d'utilisateurs actuels en base : ${allUsers.length}`);

  const usersToDelete = allUsers.filter((u) => {
    // Si l'employé a un matricule conserve (EMP-000, EMP-001, EMP-003), on le garde
    if (u.employeeId && KEPT_EMPLOYEE_IDS.includes(u.employeeId.trim())) {
      return false;
    }
    // Si l'utilisateur est un compte admin système principal (par email), on le garde
    if (KEPT_ADMIN_EMAILS.includes(u.email.toLowerCase().trim())) {
      return false;
    }
    // Tout autre utilisateur (y compris tous les salariés EMP-1xx, EMP-2xx, etc.) est SUPPRIMÉ
    return true;
  });

  const userIdsToDelete = usersToDelete.map((u) => u.id);

  console.log(`❌ Salariés ciblés pour suppression définitive (${userIdsToDelete.length})`);

  if (userIdsToDelete.length === 0) {
    console.log("✨ Aucun salarié en trop trouvé. La base contient déjà uniquement les 3 salariés autorisés.");
    return;
  }

  // Suppression en cascade dans toutes les tables associées

  const dLeaves = await prisma.leave.deleteMany({ where: { userId: { in: userIdsToDelete } } });
  console.log(` - Congés supprimés : ${dLeaves.count}`);

  const dLedger = await prisma.leaveLedgerEntry.deleteMany({ where: { userId: { in: userIdsToDelete } } });
  console.log(` - Registres de congés supprimés : ${dLedger.count}`);

  const dAttendance = await prisma.attendance.deleteMany({ where: { userId: { in: userIdsToDelete } } });
  console.log(` - Pointages supprimés : ${dAttendance.count}`);

  const dOvertime = await prisma.overtime.deleteMany({ where: { userId: { in: userIdsToDelete } } });
  console.log(` - Heures Supp supprimées : ${dOvertime.count}`);

  const dContracts = await prisma.contract.deleteMany({ where: { userId: { in: userIdsToDelete } } });
  console.log(` - Contrats RH supprimés : ${dContracts.count}`);

  const dEarningLines = await prisma.payrollEarningLine.deleteMany({ where: { payroll: { userId: { in: userIdsToDelete } } } });
  console.log(` - Lignes de Paie supprimées : ${dEarningLines.count}`);

  const dAccounting = await prisma.accountingEntry.deleteMany({ where: { payroll: { userId: { in: userIdsToDelete } } } });
  console.log(` - Écritures comptables supprimées : ${dAccounting.count}`);

  const dPayrolls = await prisma.payroll.deleteMany({ where: { userId: { in: userIdsToDelete } } });
  console.log(` - Bulletins de Paie supprimés : ${dPayrolls.count}`);

  const dLoans = await prisma.loan.deleteMany({ where: { userId: { in: userIdsToDelete } } });
  console.log(` - Prêts & Avances supprimés : ${dLoans.count}`);

  const dSeverances = await prisma.severance.deleteMany({ where: { userId: { in: userIdsToDelete } } });
  console.log(` - Soldes Tout Compte supprimés : ${dSeverances.count}`);

  await prisma.provisionCalculationSnapshot.deleteMany({});

  const dUsers = await prisma.user.deleteMany({ where: { id: { in: userIdsToDelete } } });
  console.log(`🎉 SUPPRESSION RÉUSSIE DE ${dUsers.count} SALARIÉS !`);

  // Vérification post-suppression
  const remaining = await prisma.user.findMany({
    select: { id: true, name: true, employeeId: true, email: true, companyId: true },
  });

  console.log(`✅ Salariés & Administrateurs restants en base (${remaining.length}) :`);
  remaining.forEach((r) => {
    console.log(` - [${r.employeeId || "ADMIN"}] ${r.name} (${r.email})`);
  });
}

purgeAllExceptThree()
  .catch((err) => {
    console.error("❌ Erreur lors de la purge :", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
