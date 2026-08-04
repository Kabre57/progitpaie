import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const PRIMARY_COMPANY_ID = "progitpaie-default-001";
const SECONDARY_COMPANY_ID = "validation-tenant-b-r1";

interface AuditResult {
  readonly companies: number;
  readonly primaryCases: number;
  readonly secondaryCases: number;
  readonly primaryValidationAdmins: number;
  readonly secondaryAdmins: number;
  readonly validationContracts: number;
  readonly validationPayrolls: number;
  readonly validationFinalizedPayrolls: number;
  readonly validationEarningLines: number;
  readonly validationLedgerEntries: number;
  readonly tenantMismatches: number;
  readonly casePayrollCounts: Record<string, number>;
}

function assertEqual(label: string, actual: number, expected: number): void {
  if (actual !== expected) throw new Error(`${label}: attendu ${expected}, obtenu ${actual}`);
}

async function main(): Promise<void> {
  const primaryUsers = await prisma.user.findMany({
    where: { companyId: PRIMARY_COMPANY_ID, employeeId: { startsWith: "VAL-A-C" } },
    select: { id: true, employeeId: true, companyId: true, payrolls: { select: { id: true, companyId: true, status: true, earningLines: { select: { companyId: true, classificationSource: true } } } }, leaveLedgerEntries: { select: { companyId: true } }, contracts: { select: { companyId: true } } },
    orderBy: { employeeId: "asc" },
  });
  const secondaryUsers = await prisma.user.findMany({
    where: { companyId: SECONDARY_COMPANY_ID, employeeId: { startsWith: "VAL-B-B" } },
    select: { id: true, employeeId: true, companyId: true, payrolls: { select: { id: true, companyId: true, status: true, earningLines: { select: { companyId: true, classificationSource: true } } } }, leaveLedgerEntries: { select: { companyId: true } }, contracts: { select: { companyId: true } } },
    orderBy: { employeeId: "asc" },
  });
  const validationUsers = [...primaryUsers, ...secondaryUsers];
  const payrolls = validationUsers.flatMap((user) => user.payrolls);
  const earningLines = payrolls.flatMap((payroll) => payroll.earningLines.filter(({ classificationSource }) => classificationSource === "STAGING-PROVISIONS-2025-R1"));
  const ledgerEntries = validationUsers.flatMap((user) => user.leaveLedgerEntries);
  const contracts = validationUsers.flatMap((user) => user.contracts);
  const tenantMismatches = validationUsers.reduce((total, user) => total
    + user.payrolls.filter((item) => item.companyId !== user.companyId).length
    + user.payrolls.flatMap((item) => item.earningLines).filter((item) => item.companyId !== user.companyId).length
    + user.leaveLedgerEntries.filter((item) => item.companyId !== user.companyId).length
    + user.contracts.filter((item) => item.companyId !== user.companyId).length, 0);
  const casePayrollCounts = Object.fromEntries(validationUsers.map((user) => [user.employeeId ?? user.id, user.payrolls.length]));
  const result: AuditResult = {
    companies: await prisma.company.count({ where: { id: { in: [PRIMARY_COMPANY_ID, SECONDARY_COMPANY_ID] } } }),
    primaryCases: primaryUsers.length,
    secondaryCases: secondaryUsers.length,
    primaryValidationAdmins: await prisma.user.count({ where: { companyId: PRIMARY_COMPANY_ID, email: "admin-a-r1@validation.invalid", role: "admin", isActive: true } }),
    secondaryAdmins: await prisma.user.count({ where: { companyId: SECONDARY_COMPANY_ID, role: "admin", isActive: true } }),
    validationContracts: contracts.length,
    validationPayrolls: payrolls.length,
    validationFinalizedPayrolls: payrolls.filter(({ status }) => status === "finalized").length,
    validationEarningLines: earningLines.length,
    validationLedgerEntries: ledgerEntries.length,
    tenantMismatches,
    casePayrollCounts,
  };

  assertEqual("companies", result.companies, 2);
  assertEqual("primaryCases", result.primaryCases, 18);
  assertEqual("secondaryCases", result.secondaryCases, 2);
  assertEqual("primaryValidationAdmins", result.primaryValidationAdmins, 1);
  assertEqual("secondaryAdmins", result.secondaryAdmins, 1);
  assertEqual("validationContracts", result.validationContracts, 20);
  assertEqual("validationPayrolls", result.validationPayrolls, 204);
  assertEqual("validationFinalizedPayrolls", result.validationFinalizedPayrolls, 204);
  assertEqual("validationEarningLines", result.validationEarningLines, 444);
  assertEqual("validationLedgerEntries", result.validationLedgerEntries, 21);
  assertEqual("tenantMismatches", result.tenantMismatches, 0);
  console.log(JSON.stringify({ status: "PASS", datasetId: "STAGING-PROVISIONS-2025-R1", ...result }, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Erreur inconnue");
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
