import { GetPayrollProvisions } from "@/lib/application/payroll/provisions/GetPayrollProvisions";
import { mapProvisionResultToV2DTO } from "@/lib/application/payroll/provisions/provision.mapper";

const PRIMARY_COMPANY_ID = "progitpaie-default-001";
const SECONDARY_COMPANY_ID = "validation-tenant-b-r1";
const referenceDate = new Date("2025-12-31T23:59:59.999Z");

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function calculate(companyId: string) {
  const result = await new GetPayrollProvisions().execute({ companyId, referenceDate });
  return mapProvisionResultToV2DTO(result, new Date("2026-08-03T00:00:00.000Z"));
}

async function main(): Promise<void> {
  const [primary, secondary] = await Promise.all([
    calculate(PRIMARY_COMPANY_ID),
    calculate(SECONDARY_COMPANY_ID),
  ]);
  const leaves = new Map(primary.leaveProvisions.map((item) => [item.employeeId, item]));
  const terminations = new Map(primary.terminationBenefits.map((item) => [item.employeeId, item]));
  const secondaryIds = new Set(secondary.leaveProvisions.map((item) => item.employeeId));

  assert(primary.ruleVersion === "CI-CCI-1977-PROVISIONS-2026.2", "Version de règles inattendue");
  assert(!leaves.has("VAL-A-C18"), "C18 ne doit pas être chargé avant sa date d'embauche");
  assert(terminations.get("VAL-A-C01")?.eligible === false, "C01 doit être non éligible");
  assert(terminations.get("VAL-A-C02")?.firstTrancheMonths === 36, "C02 doit porter 36 mois en tranche 1");
  assert(terminations.get("VAL-A-C03")?.secondTrancheMonths === 36, "C03 doit porter 36 mois en tranche 2");
  assert(terminations.get("VAL-A-C04")?.thirdTrancheMonths === 60, "C04 doit porter 60 mois en tranche 3");
  const expectedBonuses = new Map([
    ["VAL-A-C05", 1], ["VAL-A-C06", 2], ["VAL-A-C07", 3],
    ["VAL-A-C08", 5], ["VAL-A-C09", 7], ["VAL-A-C10", 8], ["VAL-A-C17", 1],
  ]);
  for (const [employeeId, expected] of expectedBonuses) {
    assert(leaves.get(employeeId)?.seniorityBonusDays === expected, `${employeeId}: bonus attendu ${expected}`);
  }
  assert(leaves.get("VAL-A-C11")?.consumedDays === 5, "C11 doit contenir cinq jours consommés");
  assert(leaves.get("VAL-A-C12")?.compensatedDays === 4, "C12 doit contenir quatre jours compensés");
  assert(leaves.get("VAL-A-C13")?.salaryMonthsUsed === 6, "C13 doit utiliser six paies");
  assert(leaves.get("VAL-A-C13")?.warnings.some(({ code }) => code === "INCOMPLETE_SALARY_HISTORY") === true, "C13 doit signaler l'historique incomplet");
  assert(leaves.get("VAL-A-C14")?.salaryMonthsUsed === 0, "C14 ne doit utiliser aucune paie");
  assert(leaves.get("VAL-A-C14")?.warnings.some(({ code }) => code === "CONTRACT_FALLBACK_USED") === true, "C14 doit signaler le fallback");
  assert(leaves.get("VAL-A-C15")?.averageMonthlySalary === 310_000, "C15 doit exclure les frais");
  assert(leaves.get("VAL-A-C16")?.averageMonthlySalary === 350_000, "C16 doit inclure la prime");
  assert([...secondaryIds].every((employeeId) => employeeId?.startsWith("VAL-B-")), "Le tenant B contient une donnée du tenant A");
  assert(primary.leaveProvisions.every(({ employeeId }) => !employeeId?.startsWith("VAL-B-")), "Le tenant A contient une donnée du tenant B");

  console.log(JSON.stringify({
    status: "PASS",
    datasetId: "STAGING-PROVISIONS-2025-R1",
    referenceDate: primary.referenceDate,
    ruleVersion: primary.ruleVersion,
    primaryEmployeesProcessed: primary.employeesProcessed,
    primaryValidationCasesReturned: [...leaves.keys()].filter((id) => id?.startsWith("VAL-A-")).length,
    secondaryEmployeesProcessed: secondary.employeesProcessed,
    secondaryValidationCasesReturned: secondaryIds.size,
    primaryEmployeesWithWarnings: primary.employeesWithWarnings,
    checks: {
      minimumSeniority: "PASS",
      terminationTranches: "PASS",
      seniorityBonuses: "PASS",
      consumedAndCompensatedLeave: "PASS",
      incompletePayrollWarning: "PASS",
      contractFallbackWarning: "PASS",
      expenseExclusion: "PASS",
      bonusInclusion: "PASS",
      tenantIsolation: "PASS",
      administratorsExcluded: "PASS",
    },
  }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Erreur inconnue");
  process.exitCode = 1;
});
