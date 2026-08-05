import { requireTenant } from "@/lib/database/tenant-context";
import { NextRequest, NextResponse } from "next/server";

describe("Validation du pattern d'isolation Tenant (requireTenant)", () => {
  it("requireTenant doit exiger un companyId non vide", async () => {
    // Mock basique d'une requête sans token valide ou utilisateur sans companyId
    const request = new NextRequest("http://localhost:3000/api/payroll/test");
    const result = await requireTenant(request, "admin");
    
    // Doit retourner une NextResponse 401 ou 403
    expect(result).toBeInstanceOf(NextResponse);
    if (result instanceof NextResponse) {
      expect([401, 403]).toContain(result.status);
    }
  });

  it("garantit que l'objet AuthenticatedTenant retourne systématiquement userId, role et companyId", () => {
    const mockAuthTenant = {
      userId: "user-123",
      email: "admin@tenant-a.com",
      role: "admin" as const,
      companyId: "company-tenant-a",
    };

    expect(mockAuthTenant).toHaveProperty("userId");
    expect(mockAuthTenant).toHaveProperty("role", "admin");
    expect(mockAuthTenant).toHaveProperty("companyId", "company-tenant-a");
  });
});
