import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/security/requireSuperAdmin";
import { PrismaTenantRepository } from "@/lib/infrastructure/repositories/prisma/PrismaTenantRepository";
import { ListTenantsUseCase } from "@/lib/application/tenant/use-cases/ListTenantsUseCase";
import { CreateTenantUseCase } from "@/lib/application/tenant/use-cases/CreateTenantUseCase";
import { CreateTenantSchema } from "@/shared/validation/tenant-v2.schema";

const tenantRepo = new PrismaTenantRepository();
const listTenantsUC = new ListTenantsUseCase(tenantRepo);
const createTenantUC = new CreateTenantUseCase(tenantRepo);

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const city = searchParams.get("city") ?? undefined;
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);

    const result = await listTenantsUC.execute({ search, status, city, page, limit });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("GET /api/v2/admin/tenants error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const parsed = CreateTenantSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const created = await createTenantUC.execute(parsed.data);

    return NextResponse.json(
      { success: true, data: created },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/v2/admin/tenants error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Échec de création de l'entreprise" },
      { status: 400 }
    );
  }
}
