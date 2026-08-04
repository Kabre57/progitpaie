import { PayrollStatus, UserRole } from "@prisma/client";

const mockUserFindMany = jest.fn().mockResolvedValue([]);
const mockPayrollFindMany = jest.fn().mockResolvedValue([]);
const mockLedgerFindMany = jest.fn().mockResolvedValue([]);

jest.mock("@/lib/db", () => ({
  prisma: {
    user: { findMany: mockUserFindMany },
    payroll: { findMany: mockPayrollFindMany },
    leaveLedgerEntry: { findMany: mockLedgerFindMany },
  },
}));

import { PrismaProvisionDataGateway } from "../repositories/prisma-provision.repository";

describe("PrismaProvisionDataGateway", () => {
  const referenceDate = new Date("2026-08-31T23:59:59.000Z");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("borne les salariés au tenant et à la période", async () => {
    await new PrismaProvisionDataGateway().findEmployees("company-a", referenceDate);
    expect(mockUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          companyId: "company-a",
          role: UserRole.employee,
          joiningDate: { lte: referenceDate },
        }),
      })
    );
  });

  it("charge uniquement les paies finalisées antérieures à la référence", async () => {
    await new PrismaProvisionDataGateway().findFinalizedPayrolls("company-a", referenceDate);
    expect(mockPayrollFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          companyId: "company-a",
          status: PayrollStatus.finalized,
          user: { role: UserRole.employee },
          OR: [{ year: { lt: 2026 } }, { year: 2026, month: { lte: 8 } }],
        },
        include: { earningLines: true },
      })
    );
  });

  it("borne le ledger au tenant et à la date de référence", async () => {
    await new PrismaProvisionDataGateway().findLeaveLedger("company-a", referenceDate);
    expect(mockLedgerFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          companyId: "company-a",
          effectiveDate: { lte: referenceDate },
          user: { role: UserRole.employee },
        },
      })
    );
  });
});
