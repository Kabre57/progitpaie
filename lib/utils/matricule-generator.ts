import { prisma } from "@/lib/db";

/**
 * Génère automatiquement le prochain matricule séquentiel unique (ex: EMP-001, EMP-002)
 * pour une entreprise donnée.
 *
 * @param companyId Identifiant de l'entreprise (Tenant)
 * @returns Le prochain matricule séquentiel (ex: "EMP-004")
 */
export async function generateNextEmployeeId(companyId: string): Promise<string> {
  const users = await prisma.user.findMany({
    where: {
      companyId,
      role: "employee",
      employeeId: { not: null },
    },
    select: { employeeId: true },
  });

  let maxNum = 0;
  for (const u of users) {
    if (!u.employeeId) continue;
    const match = u.employeeId.match(/EMP-(\d+)/i);
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
