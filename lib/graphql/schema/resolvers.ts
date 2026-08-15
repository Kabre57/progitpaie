import { PrismaTenantRepository } from "@/lib/infrastructure/repositories/prisma/PrismaTenantRepository";
import { PrismaEmployeeRepository } from "@/lib/infrastructure/repositories/prisma/PrismaEmployeeRepository";
import { PrismaPayrollRepository } from "@/lib/infrastructure/repositories/prisma/PrismaPayrollRepository";
import { PrismaAttendanceRepository } from "@/lib/infrastructure/repositories/prisma/PrismaAttendanceRepository";
import { PostgresFullTextSearchRepository } from "@/lib/infrastructure/search/postgres-fulltext-search";
import type { JWTPayload } from "@/types";

const ftsRepo = new PostgresFullTextSearchRepository();
const tenantRepo = new PrismaTenantRepository();
const employeeRepo = new PrismaEmployeeRepository();
const payrollRepo = new PrismaPayrollRepository();
const attendanceRepo = new PrismaAttendanceRepository();

type GraphQLContext = {
  user: JWTPayload;
  companyId: string;
};

type GraphQLParent = {
  id: string;
  joiningDate?: Date | string | null;
};

type GraphQLArgs = {
  id?: string;
  search?: string;
  limit?: number;
  month?: number;
  year?: number;
  date?: string;
};

function requireAdmin(context: GraphQLContext): void {
  if (context.user.role !== "admin" && context.user.role !== "super_admin") {
    throw new Error("Accès administrateur requis");
  }
}

function boundedLimit(limit: number | undefined): number {
  if (limit === undefined) return 50;
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("La limite doit être comprise entre 1 et 100");
  }
  return limit;
}

function validatePeriod(month: number | undefined, year: number | undefined): void {
  if (month !== undefined && (!Number.isInteger(month) || month < 1 || month > 12)) {
    throw new Error("Le mois doit être compris entre 1 et 12");
  }
  if (year !== undefined && (!Number.isInteger(year) || year < 2000 || year > 2100)) {
    throw new Error("L’année doit être comprise entre 2000 et 2100");
  }
}

export const resolvers = {
  Query: {
    company: async (_parent: unknown, _args: GraphQLArgs, context: GraphQLContext) => {
      requireAdmin(context);
      return tenantRepo.findById(context.companyId);
    },

    employees: async (_parent: unknown, args: GraphQLArgs, context: GraphQLContext) => {
      requireAdmin(context);
      const limit = boundedLimit(args.limit);
      if (args.search) {
        return ftsRepo.searchEmployees(context.companyId, args.search, limit);
      }
      const employees = await employeeRepo.list({ companyId: context.companyId, isActive: true });
      return employees.slice(0, limit);
    },

    employee: async (_parent: unknown, args: GraphQLArgs, context: GraphQLContext) => {
      requireAdmin(context);
      if (!args.id) throw new Error("L’identifiant du salarié est requis");
      return employeeRepo.findByIdForTenant(context.companyId, args.id);
    },

    payrolls: async (_parent: unknown, args: GraphQLArgs, context: GraphQLContext) => {
      requireAdmin(context);
      validatePeriod(args.month, args.year);
      return payrollRepo.list({
        companyId: context.companyId,
        month: args.month,
        year: args.year,
      });
    },

    attendances: async (_parent: unknown, args: GraphQLArgs, context: GraphQLContext) => {
      requireAdmin(context);
      return attendanceRepo.list({
        companyId: context.companyId,
        startDate: args.date,
        endDate: args.date,
      });
    },
  },

  Mutation: {
    refreshMaterializedViews: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      requireAdmin(context);
      await ftsRepo.refreshMaterializedViews();
      return true;
    },
  },

  Employee: {
    joiningDate: (parent: GraphQLParent) =>
      parent.joiningDate ? new Date(parent.joiningDate).toISOString() : "",
    payrolls: async (parent: GraphQLParent, _args: unknown, context: GraphQLContext) => {
      requireAdmin(context);
      return payrollRepo.listMy({ userId: parent.id, companyId: context.companyId });
    },
    attendances: async (parent: GraphQLParent, _args: unknown, context: GraphQLContext) => {
      requireAdmin(context);
      const list = await attendanceRepo.list({ userId: parent.id, companyId: context.companyId });
      return list.slice(0, 30);
    },
  },

  Attendance: {
    checkIn: (parent: { checkIn?: Date | string | null }) =>
      parent.checkIn ? new Date(parent.checkIn).toISOString() : "",
    checkOut: (parent: { checkOut?: Date | string | null }) =>
      parent.checkOut ? new Date(parent.checkOut).toISOString() : null,
  },
};
