import { NextRequest } from "next/server";

jest.mock("@/lib/security/requireSuperAdmin", () => ({
  requireSuperAdmin: jest.fn().mockResolvedValue({
    userId: "super-admin-001",
    email: "superadmin@progitpaie.com",
    role: "super_admin",
  }),
}));

const mockGet = jest.fn();
const mockUpdate = jest.fn();
const mockReset = jest.fn();

jest.mock("@/lib/application/admin/use-cases/GlobalSettingsUseCase", () => ({
  GlobalSettingsUseCase: jest.fn().mockImplementation(() => ({
    get: mockGet,
    update: mockUpdate,
    reset: mockReset,
  })),
}));

import { GET, PUT } from "@/app/api/v2/admin/settings/global/route";
import { POST as RESET_POST } from "@/app/api/v2/admin/settings/global/reset/route";

const MOCK_SETTINGS = {
  cnpsRates: {
    cnpsEmployeeRetraite: 6.3,
    cnpsEmployerRetraite: 7.7,
    cnpsEmployerAT: 3.0,
    cnpsEmployerPF: 5.75,
    cnpsCeilingRetraite: 1647315,
    cnpsCeilingPF_AT: 70000,
    fdfpTA: 0.4,
    fdfpFPC: 0.6,
    itsRate: 1.2,
    cmuBase: 1000,
    cmuEmployeeRate: 50,
    cmuEmployerRate: 50,
    transportExemptAmount: 30000,
    defaultHourlyBase: 173.33,
  },
  leavePolicy: {
    annualLeaveDays: 25,
    sickLeaveDays: 15,
    maternityLeaveDays: 98,
    paternityLeaveDays: 10,
  },
  securityPolicy: {
    jwtExpiresInMinutes: 120,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 15,
    requireMFA: false,
    minPasswordLength: 8,
  },
  lastUpdatedAt: new Date().toISOString(),
};

describe("API Route V2 — GET /api/v2/admin/settings/global", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retourne HTTP 200 avec les paramètres globaux", async () => {
    mockGet.mockResolvedValue(MOCK_SETTINGS);
    const req = new NextRequest("http://localhost/api/v2/admin/settings/global");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.cnpsRates.cnpsEmployeeRetraite).toBe(6.3);
    expect(json.data.leavePolicy.annualLeaveDays).toBe(25);
    expect(json.data.securityPolicy.jwtExpiresInMinutes).toBe(120);
  });

  it("retourne HTTP 401 sans authentification", async () => {
    const { requireSuperAdmin } = require("@/lib/security/requireSuperAdmin");
    const { NextResponse } = require("next/server");
    (requireSuperAdmin as jest.Mock).mockResolvedValueOnce(
      NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    );
    const req = new NextRequest("http://localhost/api/v2/admin/settings/global");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});

describe("API Route V2 — PUT /api/v2/admin/settings/global", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("met à jour les paramètres CNPS avec succès", async () => {
    mockUpdate.mockResolvedValue(MOCK_SETTINGS);
    const req = new NextRequest("http://localhost/api/v2/admin/settings/global", {
      method: "PUT",
      body: JSON.stringify({ cnpsRates: { cnpsEmployeeRetraite: 6.5 } }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PUT(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it("retourne HTTP 400 si aucune section fournie", async () => {
    const req = new NextRequest("http://localhost/api/v2/admin/settings/global", {
      method: "PUT",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PUT(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it("retourne HTTP 400 si taux hors bornes (max 100%)", async () => {
    const req = new NextRequest("http://localhost/api/v2/admin/settings/global", {
      method: "PUT",
      body: JSON.stringify({ cnpsRates: { cnpsEmployeeRetraite: 150 } }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PUT(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });
});

describe("API Route V2 — POST /api/v2/admin/settings/global/reset", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("réinitialise la section cnpsRates avec succès", async () => {
    mockReset.mockResolvedValue(MOCK_SETTINGS);
    const req = new NextRequest("http://localhost/api/v2/admin/settings/global/reset", {
      method: "POST",
      body: JSON.stringify({ section: "cnpsRates" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await RESET_POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it("retourne HTTP 400 pour une section invalide", async () => {
    const req = new NextRequest("http://localhost/api/v2/admin/settings/global/reset", {
      method: "POST",
      body: JSON.stringify({ section: "invalidSection" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await RESET_POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });
});
