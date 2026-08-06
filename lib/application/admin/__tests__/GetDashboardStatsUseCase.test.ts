import { GetDashboardStatsUseCase } from "../use-cases/GetDashboardStatsUseCase";

// Mock prisma
jest.mock("@/lib/db", () => ({
  prisma: {
    company: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    payroll: {
      aggregate: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    auditLog: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("GetDashboardStatsUseCase", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // company.count: [0] totalTenants, [1] activeTenants
    (mockPrisma.company.count as jest.Mock)
      .mockResolvedValueOnce(3)  // totalTenants
      .mockResolvedValueOnce(2); // activeTenants

    // user.count: [0] totalEmployees, [1] activeEmployees
    (mockPrisma.user.count as jest.Mock)
      .mockResolvedValueOnce(120)
      .mockResolvedValueOnce(110);

    // payroll.aggregate: [0] annual sum, [1] current month sum
    (mockPrisma.payroll.aggregate as jest.Mock)
      .mockResolvedValueOnce({ _sum: { netSalary: 48_000_000 } })
      .mockResolvedValueOnce({ _sum: { netSalary: 5_200_000 } });

    // payroll.count: [0] currentMonthPayrollCount (in Promise.all),
    //               [1] totalPayrollsCount (after Promise.all)
    (mockPrisma.payroll.count as jest.Mock)
      .mockResolvedValueOnce(45)  // current month (in Promise.all)
      .mockResolvedValueOnce(200); // total 12 months (after Promise.all)

    // user.groupBy: employees per company
    (mockPrisma.user.groupBy as jest.Mock).mockResolvedValue([
      { companyId: "c1", _count: { id: 55 } },
      { companyId: "c2", _count: { id: 40 } },
      { companyId: "c3", _count: { id: 25 } },
    ]);

    // payroll.groupBy: [0] count per company, [1] net sum per company, [2] monthly series
    (mockPrisma.payroll.groupBy as jest.Mock)
      .mockResolvedValueOnce([
        { companyId: "c1", _count: { id: 110 } },
        { companyId: "c2", _count: { id: 85 } },
      ])
      .mockResolvedValueOnce([
        { companyId: "c1", _sum: { netSalary: 27_500_000 } },
        { companyId: "c2", _sum: { netSalary: 18_000_000 } },
      ])
      .mockResolvedValueOnce([]); // monthly series — no data

    // company.findMany call order (matches Promise.all + post-Promise.all):
    // [0] inactiveTenantList (Promise.all item 12)
    // [1] tenantsWithNoPayrollThisMonth (Promise.all item 13)
    // [2] companyNames for top-tenant name resolution (after Promise.all)
    (mockPrisma.company.findMany as jest.Mock)
      .mockResolvedValueOnce([]) // inactiveTenantList → empty (no alerts)
      .mockResolvedValueOnce([]) // tenantsWithNoPayrollThisMonth → empty (no alerts)
      .mockResolvedValueOnce([   // companyNames for top tenants
        { id: "c1", name: "PROGITPAIE SIÈGE" },
        { id: "c2", name: "FILIALE BOUAKÉ" },
        { id: "c3", name: "FILIALE SAN-PEDRO" },
      ]);

    // Recent audit logs
    (mockPrisma.auditLog.findMany as jest.Mock).mockResolvedValue([
      {
        action: "CREATE_EMPLOYEE",
        targetModel: "User",
        timestamp: new Date(),
        company: { name: "PROGITPAIE SIÈGE" },
      },
    ]);
  });

  it("retourne des KPIs cohérents", async () => {
    const uc = new GetDashboardStatsUseCase();
    const result = await uc.execute();

    expect(result.kpis.totalTenants).toBe(3);
    expect(result.kpis.activeTenants).toBe(2);
    expect(result.kpis.inactiveTenants).toBe(1);
    expect(result.kpis.totalEmployees).toBe(120);
    expect(result.kpis.activeEmployees).toBe(110);
    expect(result.kpis.totalPayrollAmount).toBe(48_000_000);
    expect(result.kpis.currentMonthPayrollAmount).toBe(5_200_000);
    expect(result.kpis.currentMonthPayrollsCount).toBe(45);
    expect(result.kpis.totalPayrollsCount).toBe(200);
  });

  it("retourne exactement 12 points dans la série mensuelle", async () => {
    const uc = new GetDashboardStatsUseCase();
    const result = await uc.execute();
    expect(result.monthlySeries).toHaveLength(12);
  });

  it("retourne les top tenants avec les bons noms", async () => {
    const uc = new GetDashboardStatsUseCase();
    const result = await uc.execute();
    expect(result.topTenants.length).toBeGreaterThan(0);
    expect(result.topTenants[0].name).toBe("PROGITPAIE SIÈGE");
    expect(result.topTenants[0].employeeCount).toBe(55);
  });

  it("ne retourne aucune alerte quand tout va bien", async () => {
    const uc = new GetDashboardStatsUseCase();
    const result = await uc.execute();
    expect(result.alerts).toHaveLength(0);
  });

  it("génère un generatedAt valide en ISO", async () => {
    const uc = new GetDashboardStatsUseCase();
    const result = await uc.execute();
    expect(new Date(result.generatedAt).getTime()).not.toBeNaN();
  });
});
