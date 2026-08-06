import { NextRequest } from "next/server";

jest.mock("@/lib/security/requireSuperAdmin", () => ({
  requireSuperAdmin: jest.fn().mockResolvedValue({
    userId: "super-admin-001",
    email: "superadmin@progitpaie.com",
    role: "super_admin",
  }),
}));

const mockGetKybDetails = jest.fn();
const mockAddDocument = jest.fn();
const mockVerifyCompany = jest.fn();
const mockUpdateSubscription = jest.fn();

jest.mock("@/lib/application/admin/use-cases/ManageCompanyKybUseCase", () => ({
  ManageCompanyKybUseCase: jest.fn().mockImplementation(() => ({
    getKybDetails: mockGetKybDetails,
    addDocument: mockAddDocument,
    verifyCompany: mockVerifyCompany,
  })),
}));

jest.mock("@/lib/application/admin/use-cases/ManageSubscriptionUseCase", () => ({
  ManageSubscriptionUseCase: jest.fn().mockImplementation(() => ({
    updateSubscription: mockUpdateSubscription,
  })),
}));

import { GET as GET_DOCS, POST as POST_DOCS } from "@/app/api/v2/admin/tenants/[id]/documents/route";
import { PATCH as PATCH_VERIFY } from "@/app/api/v2/admin/tenants/[id]/verification/route";
import { PATCH as PATCH_SUB } from "@/app/api/v2/admin/tenants/[id]/subscription/route";

const MOCK_KYB = {
  companyId: "c1",
  companyName: "PROGITPAIE SIÈGE",
  verificationStatus: "APPROVED",
  verificationNotes: "Dossier valide",
  plan: "BUSINESS",
  subscriptionStatus: "ACTIVE",
  subscriptionExpiresAt: new Date().toISOString(),
  monthlyPriceFCFA: 150000,
  maxEmployeesAllowed: 100,
  documents: [
    {
      id: "doc-1",
      companyId: "c1",
      documentType: "RCCM",
      fileUrl: "/uploads/rccm.pdf",
      fileName: "rccm.pdf",
      status: "APPROVED",
      uploadedAt: new Date().toISOString(),
    },
  ],
};

describe("API Routes V2 — KYB & Abonnements Tenant", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /api/v2/admin/tenants/[id]/documents — retourne les détails KYB et documents", async () => {
    mockGetKybDetails.mockResolvedValue(MOCK_KYB);

    const req = new NextRequest("http://localhost/api/v2/admin/tenants/c1/documents");
    const res = await GET_DOCS(req, { params: Promise.resolve({ id: "c1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.companyName).toBe("PROGITPAIE SIÈGE");
    expect(json.data.documents).toHaveLength(1);
  });

  it("POST /api/v2/admin/tenants/[id]/documents — ajoute un document", async () => {
    mockAddDocument.mockResolvedValue(MOCK_KYB.documents[0]);

    const req = new NextRequest("http://localhost/api/v2/admin/tenants/c1/documents", {
      method: "POST",
      body: JSON.stringify({ documentType: "RCCM", fileName: "rccm.pdf" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST_DOCS(req, { params: Promise.resolve({ id: "c1" }) });
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.fileName).toBe("rccm.pdf");
  });

  it("PATCH /api/v2/admin/tenants/[id]/verification — approuve le dossier KYB", async () => {
    mockVerifyCompany.mockResolvedValue({ ...MOCK_KYB, verificationStatus: "APPROVED" });

    const req = new NextRequest("http://localhost/api/v2/admin/tenants/c1/verification", {
      method: "PATCH",
      body: JSON.stringify({ status: "APPROVED", notes: "Conforme" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await PATCH_VERIFY(req, { params: Promise.resolve({ id: "c1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.verificationStatus).toBe("APPROVED");
  });

  it("PATCH /api/v2/admin/tenants/[id]/subscription — met à jour l'abonnement SaaS", async () => {
    mockUpdateSubscription.mockResolvedValue({ ...MOCK_KYB, plan: "BUSINESS", monthlyPriceFCFA: 150000 });

    const req = new NextRequest("http://localhost/api/v2/admin/tenants/c1/subscription", {
      method: "PATCH",
      body: JSON.stringify({ plan: "BUSINESS", monthlyPriceFCFA: 150000 }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await PATCH_SUB(req, { params: Promise.resolve({ id: "c1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.plan).toBe("BUSINESS");
  });
});
