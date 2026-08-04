import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DATASET_ID = "STAGING-PROVISIONS-2026-R1";
const REFERENCE_DATE = new Date("2026-08-03T23:59:59.999Z");

async function main(): Promise<void> {
  const employees = await prisma.user.findMany({
    where: { employeeId: { startsWith: "VAL26-" } },
    select: {
      id: true, companyId: true, employeeId: true, joiningDate: true, jobTitle: true,
      contracts: {
        where: { status: "active" }, orderBy: { startDate: "desc" }, take: 1,
        select: { id: true, baseSalary: true, sursalaire: true, probationPeriodMonths: true },
      },
      payrolls: {
        where: { year: 2026, month: { lte: 8 } }, orderBy: { month: "asc" },
        select: {
          id: true, year: true, month: true, status: true, finalizedAt: true,
          earningLines: {
            where: { classificationSource: DATASET_ID },
            select: {
              id: true, category: true, amount: true, includedInLeaveBase: true,
              includedInTerminationBase: true, isExpenseReimbursement: true,
            },
          },
        },
      },
      leaveLedgerEntries: {
        where: { referencePeriod: "2026", effectiveDate: { lte: REFERENCE_DATE } },
        select: { id: true, entryType: true, days: true, ruleVersion: true },
      },
    },
    orderBy: { employeeId: "asc" },
  });
  if (employees.length !== 20) throw new Error(`20 cas attendus, ${employees.length} trouvés`);
  process.stdout.write(JSON.stringify({ datasetId: DATASET_ID, referenceDate: REFERENCE_DATE.toISOString(), employees }));
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Erreur inconnue");
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
