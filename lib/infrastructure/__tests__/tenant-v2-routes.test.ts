import { NextRequest } from "next/server";

const mockFindAll = jest.fn();
const mockFindById = jest.fn();
const mockSave = jest.fn();
const mockCreateWithAdmin = jest.fn();
const mockDelete = jest.fn();
const mockGetTenantAdmins = jest.fn();
const mockGetTenantStats = jest.fn();

jest.mock("@/lib/security/requireSuperAdmin", () => ({
  requireSuperAdmin: jest.fn().mockResolvedValue({
    userId: "super-admin-001",
    email: "superadmin@progitpaie.com",
    role: "super_admin",
  }),
}));

jest.mock("@/lib/infrastructure/repositories/prisma/PrismaTenantRepository", () => {
  return {
    PrismaTenantRepository: jest.fn().mockImplementation(() => {
      return {
        findAll: mockFindAll,
        findById: mockFindById,
        save: mockSave,
        createWithAdmin: mockCreateWithAdmin,
        delete: mockDelete,
        getTenantAdmins: mockGetTenantAdmins,
        getTenantStats: mockGetTenantStats,
      };
    }),
  };
});

import { GET as getTenants, POST as createTenant } from "@/app/api/v2/admin/tenants/route";

describe("API Routes V2 — Admin Tenants Management", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /api/v2/admin/tenants — retourne la liste des entreprises", async () => {
    mockFindAll.mockResolvedValue({
      tenants: [
        {
          id: { getValue: () => "tnt-001" },
          name: "ABC SARL",
          isMain: true,
          status: { getValue: () => "ACTIVE", isActive: () => true },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      total: 1,
      activeCount: 1,
      inactiveCount: 0,
      suspendedCount: 0,
      page: 1,
      limit: 20,
    });

    const req = new NextRequest("http://localhost:3000/api/v2/admin/tenants");
    const res = await getTenants(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.tenants[0].name).toBe("ABC SARL");
  });

  it("POST /api/v2/admin/tenants — crée une entreprise avec son admin", async () => {
    mockCreateWithAdmin.mockResolvedValue({
      tenant: {
        id: { getValue: () => "tnt-new" },
        name: "NOUVELLE SA",
        isMain: false,
        status: { getValue: () => "ACTIVE", isActive: () => true },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      adminId: "user-new-admin",
    });

    const body = {
      name: "NOUVELLE SA",
      adminName: "Directeur Général",
      adminEmail: "dg@nouvelle.ci",
      adminPassword: "Password1234!",
    };

    const req = new NextRequest("http://localhost:3000/api/v2/admin/tenants", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const res = await createTenant(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.tenant.name).toBe("NOUVELLE SA");
  });
});
