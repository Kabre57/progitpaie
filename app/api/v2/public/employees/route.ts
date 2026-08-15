import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatePublicApi, getPublicApiContext } from "@/lib/infrastructure/api-gateway/api-middleware";
import { ListPublicEmployeeDirectoryUseCase } from "@/lib/application/employee/use-cases/ListPublicEmployeeDirectoryUseCase";
import { PrismaPublicEmployeeDirectoryRepository } from "@/lib/infrastructure/repositories/prisma/PrismaPublicEmployeeDirectoryRepository";

const listPublicEmployees = new ListPublicEmployeeDirectoryUseCase(new PrismaPublicEmployeeDirectoryRepository());
const querySchema = z.object({
  search: z.string().trim().max(120).optional(),
  departmentId: z.string().trim().min(1).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(200).catch(50),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
});

export async function GET(request: NextRequest): Promise<Response> {
  const authError = await authenticatePublicApi(request);
  if (authError) return authError;

  const context = getPublicApiContext(request);
  if (!context) {
    return NextResponse.json({ success: false, error: "Contexte API invalide" }, { status: 403 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const query = querySchema.parse({
      search: searchParams.get("search") ?? undefined,
      departmentId: searchParams.get("departmentId") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      page: searchParams.get("page") ?? undefined,
    });
    const result = await listPublicEmployees.execute({ companyId: context.companyId, ...query });

    return NextResponse.json({
      success: true,
      apiVersion: "2.0",
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / query.limit),
      },
      count: result.employees.length,
      data: result.employees,
    });
  } catch (error: unknown) {
    console.error("GET /api/v2/public/employees error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur API v2 Employees" },
      { status: 500 }
    );
  }
}
