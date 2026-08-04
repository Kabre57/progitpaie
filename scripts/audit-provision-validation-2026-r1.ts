import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const COMPANY_A = "progitpaie-default-001";
const COMPANY_B = "validation-tenant-b-2026-r1";

function check(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  const users = await prisma.user.findMany({
    where: { employeeId: { startsWith: "VAL26-" } },
    select: {
      companyId: true, employeeId: true,
      payrolls: { where: { year: 2026 }, select: { companyId: true, month: true, status: true, finalizedAt: true, earningLines: { select: { companyId: true, classificationSource: true } } }, orderBy: { month: "asc" } },
      contracts: { where: { id: { contains: "-2026-" } }, select: { companyId: true } },
      leaveLedgerEntries: { where: { referencePeriod: "2026" }, select: { companyId: true } },
    },
    orderBy: { employeeId: "asc" },
  });
  const primary = users.filter(({ companyId }) => companyId === COMPANY_A);
  const secondary = users.filter(({ companyId }) => companyId === COMPANY_B);
  const payrolls = users.flatMap(({ payrolls: items }) => items);
  const lines = payrolls.flatMap(({ earningLines }) => earningLines.filter(({ classificationSource }) => classificationSource === "STAGING-PROVISIONS-2026-R1"));
  const contracts = users.flatMap(({ contracts: items }) => items);
  const ledger = users.flatMap(({ leaveLedgerEntries }) => leaveLedgerEntries);
  const mismatch = users.reduce((count, user) => count
    + user.payrolls.filter(({ companyId }) => companyId !== user.companyId).length
    + user.payrolls.flatMap(({ earningLines }) => earningLines).filter(({ companyId }) => companyId !== user.companyId).length
    + user.contracts.filter(({ companyId }) => companyId !== user.companyId).length
    + user.leaveLedgerEntries.filter(({ companyId }) => companyId !== user.companyId).length, 0);
  const counts = Object.fromEntries(users.map((user) => [user.employeeId ?? "UNKNOWN", user.payrolls.length]));

  check(primary.length === 18, `Cas A attendus 18, obtenus ${primary.length}`);
  check(secondary.length === 2, `Cas B attendus 2, obtenus ${secondary.length}`);
  check(await prisma.user.count({ where: { email: { in: ["admin-a-2026-r1@validation.invalid", "admin-b-2026-r1@validation.invalid"] }, role: "admin", isActive: true } }) === 2, "Administrateurs de validation manquants");
  check(contracts.length === 20, `Contrats attendus 20, obtenus ${contracts.length}`);
  check(payrolls.length === 138, `Paies attendues 138, obtenues ${payrolls.length}`);
  check(payrolls.every(({ status }) => status === "finalized"), "Une paie de validation n'est pas finalisée");
  check(payrolls.every(({ month }) => month >= 1 && month <= 8), "Une paie sort de janvier-août 2026");
  check(payrolls.every(({ finalizedAt }) => finalizedAt !== null && finalizedAt <= new Date("2026-08-03T23:59:59.999Z")), "Une paie a été finalisée après la référence");
  check(lines.length === 300, `Lignes attendues 300, obtenues ${lines.length}`);
  check(ledger.length === 21, `Écritures attendues 21, obtenues ${ledger.length}`);
  check(mismatch === 0, `Incohérences tenant: ${mismatch}`);
  check(JSON.stringify(primary.find(({ employeeId }) => employeeId === "VAL26-A-C01")?.payrolls.map(({ month }) => month)) === "[3,4,5,6,7,8]", "C01 doit couvrir mars-août");
  check(JSON.stringify(primary.find(({ employeeId }) => employeeId === "VAL26-A-C13")?.payrolls.map(({ month }) => month)) === "[5,6,7,8]", "C13 doit couvrir mai-août");

  console.log(JSON.stringify({ status: "PASS", datasetId: "STAGING-PROVISIONS-2026-R1", primaryCases: primary.length, secondaryCases: secondary.length, contracts: contracts.length, finalizedPayrolls: payrolls.length, earningLines: lines.length, ledgerEntries: ledger.length, tenantMismatches: mismatch, casePayrollCounts: counts }, null, 2));
}

main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Erreur inconnue"); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
