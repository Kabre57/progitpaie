import { getErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/security/requireSuperAdmin";
import { PrismaTenantRepository } from "@/lib/infrastructure/repositories/prisma/PrismaTenantRepository";
import { ToggleTenantStatusUseCase } from "@/lib/application/tenant/use-cases/ToggleTenantStatusUseCase";
import { ToggleTenantStatusSchema } from "@/shared/validation/tenant-v2.schema";

const tenantRepo = new PrismaTenantRepository();
const toggleTenantStatusUC = new ToggleTenantStatusUseCase(tenantRepo);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json();
    const parsed = ToggleTenantStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const updated = await toggleTenantStatusUC.execute(id, parsed.data.status);

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: unknown) {
    console.error(`PATCH /api/v2/admin/tenants/[id]/status error:`, error);
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || "Échec de modification du statut" },
      { status: 400 }
    );
  }
}
