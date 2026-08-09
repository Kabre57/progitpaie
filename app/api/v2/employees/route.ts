import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaEmployeeRepository } from "@/lib/infrastructure/repositories/prisma/PrismaEmployeeRepository";
import { ListEmployeesUseCase } from "@/lib/application/employee/use-cases/ListEmployeesUseCase";
import { CreateEmployeeUseCase } from "@/lib/application/employee/use-cases/CreateEmployeeUseCase";
import { createEmployeeSchema, listEmployeesQuerySchema } from "@/shared/validation/employee-v2.schema";
import { ApiResponse } from "@/types";

const repository = new PrismaEmployeeRepository();
const listUseCase = new ListEmployeesUseCase(repository);
const createUseCase = new CreateEmployeeUseCase(repository);

// GET /api/v2/employees - Liste des salariés (V2 Clean Architecture)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const parseResult = listEmployeesQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Paramètres de requête invalides", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const data = await listUseCase.execute({
      companyId: authResult.companyId,
      departmentId: parseResult.data.departmentId,
      isActive: parseResult.data.isActive !== undefined ? parseResult.data.isActive === "true" : undefined,
      search: parseResult.data.search,
    });

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/v2/employees error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur interne", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// POST /api/v2/employees - Créer un salarié (V2 Clean Architecture)
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json().catch(() => ({}));
    const parseResult = createEmployeeSchema.safeParse(body);
    if (!parseResult.success) {
      const issueMsg = parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      return NextResponse.json(
        { success: false, error: `Données salarié invalides: ${issueMsg}`, code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    let finalEmployeeId = parseResult.data.employeeId;
    if (!finalEmployeeId && (parseResult.data.role === "employee" || !parseResult.data.role)) {
      const { generateNextEmployeeId } = await import("@/lib/utils/matricule-generator");
      finalEmployeeId = await generateNextEmployeeId(authResult.companyId);
    }

    const data = await createUseCase.execute({
      companyId: authResult.companyId,
      ...parseResult.data,
      employeeId: finalEmployeeId,
    });

    return NextResponse.json(
      { success: true, data, message: "Salarié créé avec succès" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/v2/employees error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur de création salarié", code: "SERVER_ERROR" },
      { status: 400 }
    );
  }
}
