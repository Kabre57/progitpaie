import { GetDashboardStatsUseCase } from "../use-cases/GetDashboardStatsUseCase";
import { SuperAdminRepository, DashboardRawStatsData } from "../ports/SuperAdminRepository";

describe("GetDashboardStatsUseCase", () => {
  let mockSuperAdminRepo: jest.Mocked<SuperAdminRepository>;

  beforeEach(() => {
    mockSuperAdminRepo = {
      getDashboardStatsData: jest.fn(),
      updateCompanySubscription: jest.fn(),
      createAuditLog: jest.fn(),
      getCompanyKybDetails: jest.fn(),
      addCompanyDocument: jest.fn(),
      verifyCompany: jest.fn(),
      getGlobalSettingsRows: jest.fn(),
      upsertGlobalSetting: jest.fn(),
      getSystemBackupsList: jest.fn(),
      saveSystemBackupsList: jest.fn(),
      getCountsForBackup: jest.fn(),
      getMultiCompanyExportRows: jest.fn(),
      findAuditLogs: jest.fn(),
      getAuditLogFiltersMeta: jest.fn(),
    };

    const mockStatsData: DashboardRawStatsData = {
      totalTenants: 3,
      activeTenants: 2,
      totalEmployees: 120,
      activeEmployees: 110,
      annualPayrollSum: 48_000_000,
      currentMonthPayrollSum: 5_200_000,
      currentMonthPayrollCount: 45,
      totalPayrollsCount: 200,
      employeesByCompany: [
        { companyId: "c1", count: 55 },
        { companyId: "c2", count: 40 },
        { companyId: "c3", count: 25 },
      ],
      payrollsByCompany: [
        { companyId: "c1", count: 110 },
        { companyId: "c2", count: 85 },
      ],
      payrollNetByCompany: [
        { companyId: "c1", totalNet: 27_500_000 },
        { companyId: "c2", totalNet: 18_000_000 },
      ],
      monthlySeries: [],
      inactiveTenantList: [],
      tenantsWithNoPayrollThisMonth: [],
      recentAuditLogs: [
        {
          action: "CREATE_EMPLOYEE",
          targetModel: "User",
          timestamp: new Date(),
          companyName: "PROGITPAIE SIÈGE",
        },
      ],
      companyNames: new Map([
        ["c1", "PROGITPAIE SIÈGE"],
        ["c2", "FILIALE BOUAKÉ"],
        ["c3", "FILIALE SAN-PEDRO"],
      ]),
    };

    mockSuperAdminRepo.getDashboardStatsData.mockResolvedValue(mockStatsData);
  });

  it("retourne des KPIs cohérents", async () => {
    const uc = new GetDashboardStatsUseCase(mockSuperAdminRepo);
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
    const uc = new GetDashboardStatsUseCase(mockSuperAdminRepo);
    const result = await uc.execute();
    expect(result.monthlySeries).toHaveLength(12);
  });

  it("retourne les top tenants avec les bons noms", async () => {
    const uc = new GetDashboardStatsUseCase(mockSuperAdminRepo);
    const result = await uc.execute();
    expect(result.topTenants.length).toBeGreaterThan(0);
    expect(result.topTenants[0].name).toBe("PROGITPAIE SIÈGE");
    expect(result.topTenants[0].employeeCount).toBe(55);
  });

  it("ne retourne aucune alerte quand tout va bien", async () => {
    const uc = new GetDashboardStatsUseCase(mockSuperAdminRepo);
    const result = await uc.execute();
    expect(result.alerts).toHaveLength(0);
  });

  it("génère un generatedAt valide en ISO", async () => {
    const uc = new GetDashboardStatsUseCase(mockSuperAdminRepo);
    const result = await uc.execute();
    expect(new Date(result.generatedAt).getTime()).not.toBeNaN();
  });
});
