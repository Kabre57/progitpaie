import { NextRequest } from "next/server";

// Bouchon pour next/headers (gestion des cookies HTTP)
jest.mock("next/headers", () => ({
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }),
}));

// Bouchon pour le contexte d'isolation multi-tenant
jest.mock("@/lib/database/tenant-context", () => ({
  requireTenant: jest.fn().mockImplementation((_req: Request, requiredRole?: string) => {
    if (requiredRole === "super_admin") {
      return Promise.resolve({
        userId: "sa-test-1",
        email: "superadmin@progitpaie.online",
        role: "super_admin",
        companyId: "company-main",
        permissions: ["*"],
      });
    }
    return Promise.resolve({
      userId: "user-1",
      email: "user@client.ci",
      role: "admin",
      companyId: "company-1",
      permissions: ["*"],
    });
  }),
}));

// Bouchon des cas d'utilisation pour les tests de routes
const mockImpersonateExecute = jest.fn();
jest.mock("@/lib/application/admin/use-cases/ImpersonateTenantUseCase", () => ({
  ImpersonateTenantUseCase: jest.fn().mockImplementation(() => ({
    execute: mockImpersonateExecute,
  })),
}));

const mockGetHealthExecute = jest.fn();
jest.mock("@/lib/application/admin/use-cases/GetSystemHealthUseCase", () => ({
  GetSystemHealthUseCase: jest.fn().mockImplementation(() => ({
    execute: mockGetHealthExecute,
  })),
}));

const mockGetMetricsExecute = jest.fn();
const mockUpdateSubExecute = jest.fn();
jest.mock("@/lib/application/admin/use-cases/GetSaaSMetricsUseCase", () => ({
  GetSaaSMetricsUseCase: jest.fn().mockImplementation(() => ({
    execute: mockGetMetricsExecute,
  })),
}));
jest.mock("@/lib/application/admin/use-cases/UpdateTenantSubscriptionUseCase", () => ({
  UpdateTenantSubscriptionUseCase: jest.fn().mockImplementation(() => ({
    execute: mockUpdateSubExecute,
  })),
}));

const mockProvisionExecute = jest.fn();
jest.mock("@/lib/application/admin/use-cases/ProvisionTenantWithTemplateUseCase", () => ({
  ProvisionTenantWithTemplateUseCase: jest.fn().mockImplementation(() => ({
    execute: mockProvisionExecute,
  })),
}));

const mockListTeamExecute = jest.fn();
const mockInviteTeamExecute = jest.fn();
jest.mock("@/lib/application/admin/use-cases/ManageSuperAdminTeamUseCase", () => ({
  ManageSuperAdminTeamUseCase: jest.fn().mockImplementation(() => ({
    listMembers: mockListTeamExecute,
    inviteMember: mockInviteTeamExecute,
    updateMember: jest.fn(),
    revokeMember: jest.fn(),
  })),
}));

import { POST as impersonatePost } from "@/app/api/v2/admin/impersonate/route";
import { GET as healthGet } from "@/app/api/v2/admin/system/health/route";
import { GET as subscriptionsGet } from "@/app/api/v2/admin/subscriptions/route";
import { POST as provisionPost } from "@/app/api/v2/admin/tenants/provision/route";
import { GET as teamGet, POST as teamPost } from "@/app/api/v2/admin/team/route";

describe("Contrats d'API — Les 5 Axes Super Admin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST /api/v2/admin/impersonate — doit démarrer la session de support et définir le cookie sécurisé", async () => {
    mockImpersonateExecute.mockResolvedValue({
      isImpersonating: true,
      superAdminId: "sa-test-1",
      targetCompanyId: "comp-123",
      targetCompanyName: "Entreprise Cliente SARL",
    });

    const request = new NextRequest("http://localhost:3000/api/v2/admin/impersonate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId: "comp-123" }),
    });

    const res = await impersonatePost(request);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.targetCompanyName).toBe("Entreprise Cliente SARL");
  });

  it("GET /api/v2/admin/system/health — doit retourner le diagnostic complet de l'infrastructure", async () => {
    mockGetHealthExecute.mockResolvedValue({
      status: "HEALTHY",
      database: { status: "CONNECTED", latencyMs: 3 },
      redis: { status: "CONNECTED" },
    });

    const request = new NextRequest("http://localhost:3000/api/v2/admin/system/health");
    const res = await healthGet(request);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.status).toBe("HEALTHY");
  });

  it("GET /api/v2/admin/subscriptions — doit retourner les métriques SaaS et les quotas", async () => {
    mockGetMetricsExecute.mockResolvedValue({
      metrics: { mrrFCFA: 1000000 },
      tenants: [],
    });

    const request = new NextRequest("http://localhost:3000/api/v2/admin/subscriptions");
    const res = await subscriptionsGet(request);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.metrics.mrrFCFA).toBe(1000000);
  });

  it("POST /api/v2/admin/tenants/provision — doit créer une entreprise et son administrateur", async () => {
    mockProvisionExecute.mockResolvedValue({
      company: { id: "comp-new", name: "Nouvelle Entreprise SARL", isDemo: false, plan: "STARTER", city: "Abidjan" },
      adminUser: { id: "admin-new", email: "admin@nouvelle.ci", name: "Administrateur Principal" },
      departmentsCreated: 5,
      sampleEmployeesCreated: 0,
    });

    const request = new NextRequest("http://localhost:3000/api/v2/admin/tenants/provision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Nouvelle Entreprise SARL",
        adminName: "Administrateur Principal",
        adminEmail: "admin@nouvelle.ci",
        adminPassword: "MotDePasseSecurise123!",
      }),
    });

    const res = await provisionPost(request);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.company.name).toBe("Nouvelle Entreprise SARL");
  });

  it("GET et POST /api/v2/admin/team — doit gérer la liste et l'ajout de membres Super Admin", async () => {
    mockListTeamExecute.mockResolvedValue([
      { id: "sa-1", name: "Super Administrateur", email: "superadmin@progitpaie.online", role: "super_admin", isActive: true },
    ]);
    mockInviteTeamExecute.mockResolvedValue({
      id: "sa-2",
      name: "Nouvel Admin",
      email: "admin2@progitpaie.online",
      role: "super_admin",
      isActive: true,
    });

    const getReq = new NextRequest("http://localhost:3000/api/v2/admin/team");
    const getRes = await teamGet(getReq);
    const getJson = await getRes.json();
    expect(getRes.status).toBe(200);
    expect(getJson.data).toHaveLength(1);

    const postReq = new NextRequest("http://localhost:3000/api/v2/admin/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Nouvel Admin",
        email: "admin2@progitpaie.online",
        password: "MotDePasseSecurise123!",
      }),
    });
    const postRes = await teamPost(postReq);
    const postJson = await postRes.json();
    expect(postRes.status).toBe(201);
    expect(postJson.success).toBe(true);
    expect(postJson.data.name).toBe("Nouvel Admin");
  });
});
