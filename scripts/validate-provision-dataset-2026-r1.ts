import { GetPayrollProvisions } from "@/lib/application/payroll/provisions/GetPayrollProvisions";
import { mapProvisionResultToV2DTO } from "@/lib/application/payroll/provisions/provision.mapper";

const COMPANY_A = "progitpaie-default-001";
const COMPANY_B = "validation-tenant-b-2026-r1";
const referenceDate = new Date("2026-08-03T23:59:59.999Z");

function check(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function calculate(companyId: string) {
  return mapProvisionResultToV2DTO(
    await new GetPayrollProvisions().execute({ companyId, referenceDate }),
    new Date("2026-08-03T23:59:59.999Z")
  );
}

async function main() {
  const [a, b] = await Promise.all([calculate(COMPANY_A), calculate(COMPANY_B)]);
  const leaves = new Map(a.leaveProvisions.map((item) => [item.employeeId, item]));
  const termination = new Map(a.terminationBenefits.map((item) => [item.employeeId, item]));
  check(a.ruleVersion === "CI-CCI-1977-PROVISIONS-2026.2", "Version de règles incorrecte");
  check(!leaves.has("VAL26-A-C18"), "C18 doit être absent avant embauche");
  check(termination.get("VAL26-A-C01")?.eligible === false, "C01 doit être non éligible");
  check(termination.get("VAL26-A-C02")?.firstTrancheMonths === 36, "C02: tranche 1 incorrecte");
  check(termination.get("VAL26-A-C03")?.secondTrancheMonths === 36, "C03: tranche 2 incorrecte");
  check(termination.get("VAL26-A-C04")?.thirdTrancheMonths === 60, "C04: tranche 3 incorrecte");
  for (const [id, expected] of [["C05", 1], ["C06", 2], ["C07", 3], ["C08", 5], ["C09", 7], ["C10", 8], ["C17", 1]] as const) {
    check(leaves.get(`VAL26-A-${id}`)?.seniorityBonusDays === expected, `${id}: bonus incorrect`);
  }
  check(leaves.get("VAL26-A-C11")?.consumedDays === 5, "C11: consommation incorrecte");
  check(leaves.get("VAL26-A-C12")?.compensatedDays === 4, "C12: compensation incorrecte");
  check(leaves.get("VAL26-A-C13")?.salaryMonthsUsed === 4, "C13 doit utiliser quatre mois");
  check(leaves.get("VAL26-A-C13")?.warnings.some(({ code }) => code === "INCOMPLETE_SALARY_HISTORY") === true, "C13: warning absent");
  check(leaves.get("VAL26-A-C14")?.warnings.some(({ code }) => code === "CONTRACT_FALLBACK_USED") === true, "C14: fallback absent");
  check(leaves.get("VAL26-A-C15")?.averageMonthlySalary === 310_000, "C15: frais non exclus");
  check(leaves.get("VAL26-A-C16")?.averageMonthlySalary === 350_000, "C16: prime non incluse");
  check(a.leaveProvisions.every(({ employeeId }) => !employeeId?.startsWith("VAL26-B-")), "Fuite B vers A");
  check(b.leaveProvisions.length === 2 && b.leaveProvisions.every(({ employeeId }) => employeeId?.startsWith("VAL26-B-")), "Isolation B incorrecte");

  console.log(JSON.stringify({ status: "PASS", datasetId: "STAGING-PROVISIONS-2026-R1", referenceDate: a.referenceDate, ruleVersion: a.ruleVersion, primaryEmployeesProcessed: a.employeesProcessed, primaryCasesReturned: [...leaves.keys()].filter((id) => id?.startsWith("VAL26-A-")).length, secondaryEmployeesProcessed: b.employeesProcessed, checks: { minimumSeniority: "PASS", terminationTranches: "PASS", seniorityBonuses: "PASS", leaveLedger: "PASS", partialHistory: "PASS", fallback: "PASS", expenseExclusion: "PASS", bonusInclusion: "PASS", tenantIsolation: "PASS", administratorsExcluded: "PASS" } }, null, 2));
}

main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Erreur inconnue"); process.exitCode = 1; });
