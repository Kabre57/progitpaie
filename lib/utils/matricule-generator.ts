import { PrismaEmployeeRepository } from "@/lib/infrastructure/repositories/prisma/PrismaEmployeeRepository";

/**
 * Génère automatiquement le prochain matricule séquentiel unique (ex: EMP-001, EMP-002)
 * pour une entreprise donnée.
 *
 * @param companyId Identifiant de l'entreprise (Tenant)
 * @returns Le prochain matricule séquentiel (ex: "EMP-004")
 */
export async function generateNextEmployeeId(companyId: string): Promise<string> {
  const employeeRepo = new PrismaEmployeeRepository();
  const employees = await employeeRepo.list({ companyId });

  let maxNum = 0;
  for (const u of employees) {
    if (!u.employeeId) continue;
    const empIdStr = u.employeeId.value;
    const match = empIdStr.match(/EMP-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  const nextNum = maxNum + 1;
  const padded = String(nextNum).padStart(3, "0");
  return `EMP-${padded}`;
}
