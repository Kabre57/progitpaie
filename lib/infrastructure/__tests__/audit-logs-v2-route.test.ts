import { NextRequest } from "next/server";

jest.mock("@/lib/security/requireSuperAdmin", () => ({
  requireSuperAdmin: jest.fn().mockResolvedValue({
    userId: "super-admin-001",
    email: "superadmin@progitpaie.com",
    role: "super_admin",
  }),
}));

const mockExecute = jest.fn();
const mockGetFiltersMeta = jest.fn();

jest.mock("@/lib/application/admin/use-cases/GetAuditLogsUseCase", () => ({
  GetAuditLogsUseCase: jest.fn().mockImplementation(() => ({
    execute: mockExecute,
    getFiltersMeta: mockGetFiltersMeta,
  })),
}));

import { GET } from "@/app/api/v2/admin/audit-logs/route";

const MOCK_RESULT = {
  logs: [
    {
      id: "log-001",
      action: "CREATE_EMPLOYEE",
      targetModel: "User",
      targetId: "usr-abc",
      companyId: "cmp-001",
      companyName: "PROGITPAIE SIÈGE",
      performedById: "admin-001",
      performedByName: "Jean Konan",
      performedByEmail: "jkonan@progitpaie.ci",
      timestamp: new Date().toISOString(),
    },
  ],
  total: 1,
  page: 1,
  limit: 50,
  totalPages: 1,
};

const MOCK_META = {
  actions: ["CREATE_EMPLOYEE", "DELETE_PAYROLL"],
  targetModels: ["User", "Payroll"],
  companies: [{ id: "cmp-001", name: "PROGITPAIE SIÈGE" }],
};

describe("API Route V2 — GET /api/v2/admin/audit-logs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retourne la liste paginée des logs avec HTTP 200", async () => {
    mockExecute.mockResolvedValue(MOCK_RESULT);

    const req = new NextRequest("http://localhost/api/v2/admin/audit-logs?page=1&limit=50");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.logs[0].action).toBe("CREATE_EMPLOYEE");
    expect(json.data.total).toBe(1);
  });

  it("retourne les méta-données de filtres quand meta=1", async () => {
    mockGetFiltersMeta.mockResolvedValue(MOCK_META);

    const req = new NextRequest("http://localhost/api/v2/admin/audit-logs?meta=1");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.actions).toContain("CREATE_EMPLOYEE");
    expect(json.data.companies[0].name).toBe("PROGITPAIE SIÈGE");
  });

  it("retourne HTTP 401 sans authentification", async () => {
    const { requireSuperAdmin } = require("@/lib/security/requireSuperAdmin");
    const { NextResponse } = require("next/server");
    (requireSuperAdmin as jest.Mock).mockResolvedValueOnce(
      NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    );

    const req = new NextRequest("http://localhost/api/v2/admin/audit-logs");
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it("retourne HTTP 500 si le use case lève une exception", async () => {
    mockExecute.mockRejectedValue(new Error("DB error"));

    const req = new NextRequest("http://localhost/api/v2/admin/audit-logs?page=1");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
  });
});
