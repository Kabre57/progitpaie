import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaEmployeeRepository } from "@/lib/infrastructure/repositories/prisma/PrismaEmployeeRepository";
import { PrismaPayrollRepository } from "@/lib/infrastructure/repositories/prisma/PrismaPayrollRepository";
import { PrismaLeaveRepository } from "@/lib/infrastructure/repositories/prisma/PrismaLeaveRepository";
import { PrismaLoanRepository } from "@/lib/infrastructure/repositories/prisma/PrismaLoanRepository";
import { PrismaContractRepository } from "@/lib/infrastructure/repositories/prisma/PrismaContractRepository";
import { prisma } from "@/lib/db";

// Mock Prisma and auth to simulate strict multi-tenant isolation
jest.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    payroll: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    leave: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    loan: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    contract: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

jest.mock("@/lib/middleware-helpers", () => ({
  requireAuth: jest.fn(),
}));

import { requireAuth } from "@/lib/middleware-helpers";
import type { AuthenticatedTenant } from "@/lib/database/tenant-context";

describe("Cross-Tenant Isolation (Sécurité Multi-Tenant)", () => {
  const companyA = "company_tenant_A";
  const companyB = "company_tenant_B";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("1. requireTenant Context Integrity", () => {
    it("interdit l'accès si l'utilisateur n'appartient à aucune société", async () => {
      (requireAuth as jest.Mock).mockResolvedValue({
        userId: "user_orphan",
        role: "admin",
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "user_orphan",
        email: "orphan@test.com",
        role: "admin",
        companyId: null,
        isActive: true,
      });

      const req = new NextRequest("http://localhost:3000/api/v2/employees");
      const res = await requireTenant(req, "admin");

      expect(res).toBeInstanceOf(NextResponse);
      if (res instanceof NextResponse) {
        expect(res.status).toBe(403);
        const body = await res.json();
        expect(body.code).toBe("TENANT_REQUIRED");
      }
    });

    it("interdit l'accès si le rôle requis n'est pas satisfait", async () => {
      (requireAuth as jest.Mock).mockResolvedValue({
        userId: "emp_1",
        role: "employee",
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "emp_1",
        email: "emp@company-a.com",
        role: "employee",
        companyId: companyA,
        isActive: true,
      });

      const req = new NextRequest("http://localhost:3000/api/v2/employees");
      const res = await requireTenant(req, "admin");

      expect(res).toBeInstanceOf(NextResponse);
      if (res instanceof NextResponse) {
        expect(res.status).toBe(403);
        const body = await res.json();
        expect(body.code).toBe("FORBIDDEN");
      }
    });

    it("accepte si le rôle fait partie d'une liste de rôles autorisés", async () => {
      (requireAuth as jest.Mock).mockResolvedValue({
        userId: "admin_1",
        role: "admin",
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "admin_1",
        email: "admin@company-a.com",
        role: "admin",
        companyId: companyA,
        isActive: true,
      });

      const req = new NextRequest("http://localhost:3000/api/v2/employees");
      const res = await requireTenant(req, ["admin", "super_admin"]);

      expect(res).not.toBeInstanceOf(NextResponse);
      if (!(res instanceof NextResponse)) {
        const tenant = res as AuthenticatedTenant;
        expect(tenant.companyId).toBe(companyA);
        expect(tenant.companyId).not.toBe(companyB);
      }
    });
  });

  describe("2. Repositories Company Scope Enforcement", () => {
    it("PrismaEmployeeRepository.findByIdForTenant filtre toujours par companyId", async () => {
      const repo = new PrismaEmployeeRepository();
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await repo.findByIdForTenant(companyA, "target_emp_id");

      expect(prisma.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "target_emp_id",
            companyId: companyA,
          }),
        })
      );
    });

    it("PrismaPayrollRepository.findByIdForTenant filtre toujours par companyId", async () => {
      const repo = new PrismaPayrollRepository();
      (prisma.payroll.findFirst as jest.Mock).mockResolvedValue(null);

      await repo.findByIdForTenant(companyA, "target_payroll_id");

      expect(prisma.payroll.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "target_payroll_id",
            companyId: companyA,
          }),
        })
      );
    });

    it("PrismaLeaveRepository.findByIdForTenant filtre toujours par companyId", async () => {
      const repo = new PrismaLeaveRepository();
      (prisma.leave.findFirst as jest.Mock).mockResolvedValue(null);

      await repo.findByIdForTenant(companyA, "target_leave_id");

      expect(prisma.leave.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "target_leave_id",
            companyId: companyA,
          }),
        })
      );
    });

    it("PrismaLoanRepository.findByIdForTenant filtre toujours par companyId", async () => {
      const repo = new PrismaLoanRepository();
      (prisma.loan.findFirst as jest.Mock).mockResolvedValue(null);

      await repo.findByIdForTenant(companyA, "target_loan_id");

      expect(prisma.loan.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "target_loan_id",
            companyId: companyA,
          }),
        })
      );
    });

    it("PrismaContractRepository.findByIdForTenant filtre toujours par companyId", async () => {
      const repo = new PrismaContractRepository();
      (prisma.contract.findFirst as jest.Mock).mockResolvedValue(null);

      await repo.findByIdForTenant(companyA, "target_contract_id");

      expect(prisma.contract.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "target_contract_id",
            companyId: companyA,
          }),
        })
      );
    });
  });
});
