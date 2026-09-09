import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaImpersonationAuditRepository } from "@/lib/infrastructure/repositories/prisma/PrismaImpersonationAuditRepository";
import { ApiResponse } from "@/types";

// GET /api/v2/admin/impersonate/status - Récupère l'état courant de l'impersonation
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "super_admin");
    if (authResult instanceof NextResponse) {
      return NextResponse.json({ success: true, data: { isImpersonating: false } });
    }

    const cookieStore = await cookies();
    const impersonatedCompanyId = cookieStore.get("rbeas_impersonate")?.value;

    if (!impersonatedCompanyId) {
      return NextResponse.json({ success: true, data: { isImpersonating: false } });
    }

    const impersonationRepo = new PrismaImpersonationAuditRepository();
    const company = await impersonationRepo.getCompanyDetails(impersonatedCompanyId);
    if (!company) {
      cookieStore.delete("rbeas_impersonate");
      return NextResponse.json({ success: true, data: { isImpersonating: false } });
    }

    return NextResponse.json({
      success: true,
      data: {
        isImpersonating: true,
        superAdminId: authResult.userId,
        superAdminEmail: authResult.email,
        targetCompanyId: company.id,
        targetCompanyName: company.name,
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/v2/admin/impersonate/status error:", error);
    return NextResponse.json({ success: true, data: { isImpersonating: false } });
  }
}
