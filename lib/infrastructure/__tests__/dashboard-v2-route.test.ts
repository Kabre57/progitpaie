import { NextRequest } from "next/server";

// Mock requireSuperAdmin — must come before module imports
jest.mock("@/lib/security/requireSuperAdmin", () => ({
  requireSuperAdmin: jest.fn().mockResolvedValue({
    userId: "super-admin-001",
    email: "superadmin@progitpaie.com",
    role: "super_admin",
  }),
}));

const mockExecute = jest.fn();

jest.mock("@/lib/application/admin/use-cases/GetDashboardStatsUseCase", () => ({
  GetDashboardStatsUseCase: jest.fn().mockImplementation(() => ({
    execute: mockExecute,
  })),
}));

import { GET } from "@/app/api/v2/admin/dashboard/stats/route";

const MOCK_STATS = {
  kpis: {
    totalTenants: 3,
    activeTenants: 2,
    inactiveTenants: 1,
    totalEmployees: 120,
    activeEmployees: 110,
    totalPayrollAmount: 48_000_000,
    totalPayrollsCount: 200,
    currentMonthPayrollAmount: 5_200_000,
    currentMonthPayrollsCount: 45,
  },
  monthlySeries: [],
  topTenants: [],
  alerts: [],
  recentActivity: [],
  generatedAt: new Date().toISOString(),
};

describe("API Route V2 — GET /api/v2/admin/dashboard/stats", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retourne HTTP 200 avec les statistiques du dashboard", async () => {
    mockExecute.mockResolvedValue(MOCK_STATS);

    const req = new NextRequest("http://localhost:3000/api/v2/admin/dashboard/stats");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.kpis.totalTenants).toBe(3);
    expect(json.data.kpis.totalEmployees).toBe(120);
    expect(json.data.kpis.totalPayrollAmount).toBe(48_000_000);
  });

  it("retourne HTTP 401 si l'authentification échoue", async () => {
    const { requireSuperAdmin } = require("@/lib/security/requireSuperAdmin");
    const { NextResponse } = require("next/server");
    (requireSuperAdmin as jest.Mock).mockResolvedValueOnce(
      NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    );

    const req = new NextRequest("http://localhost:3000/api/v2/admin/dashboard/stats");
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it("retourne HTTP 500 si le use case lève une exception", async () => {
    mockExecute.mockRejectedValue(new Error("Database connection error"));

    const req = new NextRequest("http://localhost:3000/api/v2/admin/dashboard/stats");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error).toBe("Database connection error");
  });
});
