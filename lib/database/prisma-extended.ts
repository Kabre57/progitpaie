import { prisma } from "@/lib/db";

/**
 * Extended Prisma Client with automated query extensions,
 * soft-delete handling, and tenant filtering utilities.
 */
export const extendedPrisma = prisma.$extends({
  name: "progitpaie-extended-client",
  model: {
    user: {
      async findActiveEmployeesByCompany(companyId: string) {
        return prisma.user.findMany({
          where: { companyId, isActive: true },
          orderBy: { name: "asc" },
        });
      },
    },
    payroll: {
      async findFinalizedPayrollsByPeriod(companyId: string, month: number, year: number) {
        return prisma.payroll.findMany({
          where: { companyId, month, year, status: "finalized" },
          include: { user: { select: { id: true, name: true, employeeId: true, jobTitle: true } } },
          orderBy: { user: { name: "asc" } },
        });
      },
    },
  },
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const start = Date.now();
        const result = await query(args);
        const duration = Date.now() - start;

        if (process.env.NODE_ENV === "development" && duration > 200) {
          console.warn(`⚠️ [PRISMA PERF WARNING] ${model}.${operation} took ${duration}ms`);
        }

        return result;
      },
    },
  },
});

export type ExtendedPrismaClient = typeof extendedPrisma;
