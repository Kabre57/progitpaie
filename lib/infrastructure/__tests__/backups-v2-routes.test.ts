import { NextRequest } from "next/server";

jest.mock("@/lib/security/requireSuperAdmin", () => ({
  requireSuperAdmin: jest.fn().mockResolvedValue({
    userId: "super-admin-001",
    email: "superadmin@progitpaie.com",
    role: "super_admin",
  }),
}));

const mockListBackups = jest.fn();
const mockCreateBackup = jest.fn();
const mockGenerateMultiCompanyExport = jest.fn();

jest.mock("@/lib/application/admin/use-cases/BackupExportUseCase", () => ({
  BackupExportUseCase: jest.fn().mockImplementation(() => ({
    listBackups: mockListBackups,
    createBackup: mockCreateBackup,
    generateMultiCompanyExport: mockGenerateMultiCompanyExport,
  })),
}));

import { GET, POST as BACKUP_POST } from "@/app/api/v2/admin/backups/route";
import { POST as EXPORT_POST } from "@/app/api/v2/admin/export/multi-company/route";

const MOCK_BACKUP = {
  id: "bkp-123",
  filename: "progitpaie_backup_full_2026-08-06.json",
  sizeBytes: 1048576,
  sizeFormatted: "1.00 MB",
  status: "COMPLETED",
  companyCount: 5,
  recordCount: 450,
  createdAt: new Date().toISOString(),
};

describe("API Route V2 — GET /api/v2/admin/backups", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("retourne la liste des sauvegardes système", async () => {
    mockListBackups.mockResolvedValue([MOCK_BACKUP]);

    const req = new NextRequest("http://localhost/api/v2/admin/backups");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data[0].filename).toBe("progitpaie_backup_full_2026-08-06.json");
  });

  it("retourne HTTP 401 sans authentification", async () => {
    const { requireSuperAdmin } = require("@/lib/security/requireSuperAdmin");
    const { NextResponse } = require("next/server");
    (requireSuperAdmin as jest.Mock).mockResolvedValueOnce(
      NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    );

    const req = new NextRequest("http://localhost/api/v2/admin/backups");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});

describe("API Route V2 — POST /api/v2/admin/backups", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("crée une nouvelle sauvegarde système avec HTTP 201", async () => {
    mockCreateBackup.mockResolvedValue(MOCK_BACKUP);

    const req = new NextRequest("http://localhost/api/v2/admin/backups", { method: "POST" });
    const res = await BACKUP_POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.id).toBe("bkp-123");
  });
});

describe("API Route V2 — POST /api/v2/admin/export/multi-company", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("génère l'export CSV multi-entreprises avec HTTP 200", async () => {
    mockGenerateMultiCompanyExport.mockResolvedValue({
      summary: { companyCount: 2, totalEmployees: 50, totalPayrolls: 100, totalNetSalary: 25000000, exportedAt: new Date().toISOString() },
      csvContent: "\uFEFFID Entreprise,Nom Entreprise\r\nc1,ABC SARL\r\n",
    });

    const req = new NextRequest("http://localhost/api/v2/admin/export/multi-company", {
      method: "POST",
      body: JSON.stringify({ companyIds: ["c1"] }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await EXPORT_POST(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
  });
});
