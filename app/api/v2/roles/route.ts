import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaRoleRepository } from "@/lib/infrastructure/repositories/prisma/PrismaRoleRepository";
import { ListRolesUseCase } from "@/lib/application/role/use-cases/ListRolesUseCase";
import { CreateRoleUseCase } from "@/lib/application/role/use-cases/CreateRoleUseCase";
import { createRoleSchema } from "@/shared/validation/role-v2.schema";
import { ApiResponse } from "@/types";

const roleRepo = new PrismaRoleRepository();
const listRolesUseCase = new ListRolesUseCase(roleRepo);
const createRoleUseCase = new CreateRoleUseCase(roleRepo);

// GET /api/v2/roles - Liste des rôles personnalisés de l'entreprise
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const roles = await listRolesUseCase.execute(authResult.companyId);
    return NextResponse.json({ success: true, data: roles }, { status: 200 });
  } catch (error: unknown) {
    console.error("GET /api/v2/roles error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des rôles", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// POST /api/v2/roles - Créer un nouveau rôle avec matrice de permissions
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json().catch(() => ({}));
    const parseResult = createRoleSchema.safeParse(body);
    if (!parseResult.success) {
      const issueMsg = parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      return NextResponse.json(
        { success: false, error: `Données de rôle invalides: ${issueMsg}`, code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const created = await createRoleUseCase.execute(authResult.companyId, parseResult.data);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "ROLE_NAME_ALREADY_EXISTS") {
        return NextResponse.json(
          { success: false, error: "Un rôle avec ce nom existe déjà", code: "ROLE_EXISTS" },
          { status: 409 }
        );
      }
    }
    console.error("POST /api/v2/roles error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la création du rôle", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
