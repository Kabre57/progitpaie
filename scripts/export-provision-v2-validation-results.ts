import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { GetPayrollProvisions } from "../lib/application/payroll/provisions/GetPayrollProvisions";
import { mapProvisionResultToV2DTO } from "../lib/application/payroll/provisions/provision.mapper";

const REFERENCE_DATE = new Date("2026-08-03T23:59:59.999Z");
const TENANTS = {
  A: "progitpaie-default-001",
  B: "validation-tenant-b-2026-r1",
} as const;

async function main(): Promise<void> {
  const outputDirectory = path.resolve("docs/validation/evidence/comparison");
  await mkdir(outputDirectory, { recursive: true });
  const useCase = new GetPayrollProvisions();

  for (const [tenant, companyId] of Object.entries(TENANTS)) {
    const result = await useCase.execute({ companyId, referenceDate: REFERENCE_DATE });
    const dto = mapProvisionResultToV2DTO(result);
    const output = path.join(outputDirectory, `tenant-${tenant.toLowerCase()}-provisions-v2-2026-08-03.json`);
    await writeFile(output, JSON.stringify({ success: true, data: dto }, null, 2) + "\n", "utf8");
    process.stdout.write(`${tenant}: ${dto.employeesProcessed} salariés -> ${output}\n`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Erreur inconnue");
  process.exitCode = 1;
});
