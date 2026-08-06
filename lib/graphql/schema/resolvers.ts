import { prisma } from "@/lib/db";
import { PostgresFullTextSearchRepository } from "@/lib/infrastructure/search/postgres-fulltext-search";

const ftsRepo = new PostgresFullTextSearchRepository();

export const resolvers = {
  Query: {
    company: async (_: any, { id }: { id: string }, context: { companyId?: string }) => {
      const companyId = context.companyId || id;
      return prisma.company.findUnique({
        where: { id: companyId },
        include: { employees: true },
      });
    },

    employees: async (_: any, { search, limit = 50 }: { search?: string; limit?: number }, context: { companyId?: string }) => {
      const companyId = context.companyId || "progitpaie-default-001";
      if (search) {
        return ftsRepo.searchEmployees(companyId, search, limit);
      }
      return prisma.user.findMany({
        where: { companyId, isActive: true },
        take: limit,
        orderBy: { name: "asc" },
      });
    },

    employee: async (_: any, { id }: { id: string }, context: { companyId?: string }) => {
      return prisma.user.findUnique({
        where: { id },
        include: { payrolls: true, attendances: true },
      });
    },

    payrolls: async (_: any, { month, year }: { month?: number; year?: number }, context: { companyId?: string }) => {
      const companyId = context.companyId || "progitpaie-default-001";
      const where: any = { companyId };
      if (month) where.month = month;
      if (year) where.year = year;
      return prisma.payroll.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });
    },

    attendances: async (_: any, { date }: { date?: string }, context: { companyId?: string }) => {
      const companyId = context.companyId || "progitpaie-default-001";
      const where: any = { companyId };
      if (date) where.date = date;
      return prisma.attendance.findMany({
        where,
        orderBy: { checkIn: "desc" },
      });
    },
  },

  Mutation: {
    refreshMaterializedViews: async () => {
      await ftsRepo.refreshMaterializedViews();
      return true;
    },
  },

  Employee: {
    joiningDate: (parent: any) => parent.joiningDate ? new Date(parent.joiningDate).toISOString() : "",
    payrolls: async (parent: any) => {
      return prisma.payroll.findMany({
        where: { userId: parent.id },
        orderBy: { year: "desc", month: "desc" },
      });
    },
    attendances: async (parent: any) => {
      return prisma.attendance.findMany({
        where: { userId: parent.id },
        take: 30,
        orderBy: { checkIn: "desc" },
      });
    },
  },

  Attendance: {
    checkIn: (parent: any) => parent.checkIn ? new Date(parent.checkIn).toISOString() : "",
    checkOut: (parent: any) => parent.checkOut ? new Date(parent.checkOut).toISOString() : null,
  },
};
