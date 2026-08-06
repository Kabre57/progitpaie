import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/security/requireSuperAdmin";
import { PrismaTenantRepository } from "@/lib/infrastructure/repositories/prisma/PrismaTenantRepository";
import { GetTenantByIdUseCase } from "@/lib/application/tenant/use-cases/GetTenantByIdUseCase";
import { DeleteTenantUseCase } from "@/lib/application/tenant/use-cases/DeleteTenantUseCase";
import { UpdateTenantSchema, DeleteTenantSchema } from "@/shared/validation/tenant-v2.schema";
import { TenantMapper } from "@/lib/application/tenant/mappers/tenant.mapper";

const tenantRepo = new PrismaTenantRepository();
const getTenantByIdUC = new GetTenantByIdUseCase(tenantRepo);
const deleteTenantUC = new DeleteTenantUseCase(tenantRepo);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const result = await getTenantByIdUC.execute(id);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error(`GET /api/v2/admin/tenants/[id] error:`, error);
    return NextResponse.json(
      { success: false, error: error.message || "Entreprise non trouvée" },
      { status: 404 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const tenant = await tenantRepo.findById(id);
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: `Entreprise non trouvée: ${id}` },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = UpdateTenantSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const updatedProps = {
      name: parsed.data.name ?? tenant.name,
      taxNumber: parsed.data.taxNumber ?? tenant.taxNumber,
      cnpsNumber: parsed.data.cnpsNumber ?? tenant.cnpsNumber,
      rccm: parsed.data.rccm ?? tenant.rccm,
      address: parsed.data.address ?? tenant.address,
      city: parsed.data.city ?? tenant.city,
      country: parsed.data.country ?? tenant.country,
      phone: parsed.data.phone ?? tenant.phone,
      email: parsed.data.email ?? tenant.email,
    };

    Object.assign(tenant, updatedProps);
    await tenantRepo.save(tenant);

    return NextResponse.json({
      success: true,
      data: TenantMapper.toDTO(tenant),
    });
  } catch (error: any) {
    console.error(`PUT /api/v2/admin/tenants/[id] error:`, error);
    return NextResponse.json(
      { success: false, error: error.message || "Échec de mise à jour" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json();
    const parsed = DeleteTenantSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const result = await deleteTenantUC.execute(id, parsed.data.confirmationName);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error(`DELETE /api/v2/admin/tenants/[id] error:`, error);
    return NextResponse.json(
      { success: false, error: error.message || "Échec de la suppression" },
      { status: 400 }
    );
  }
}
