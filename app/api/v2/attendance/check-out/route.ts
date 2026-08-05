import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaAttendanceRepository } from "@/lib/infrastructure/repositories/prisma/PrismaAttendanceRepository";
import { CheckOutUseCase } from "@/lib/application/attendance/use-cases/CheckOutUseCase";
import { ApiResponse } from "@/types";

const repository = new PrismaAttendanceRepository();
const checkOutUseCase = new CheckOutUseCase(repository);

// POST /api/v2/attendance/check-out - Pointage de sortie (V2 Clean Architecture)
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request);
    if (authResult instanceof NextResponse) return authResult;

    const data = await checkOutUseCase.execute({
      companyId: authResult.companyId,
      userId: authResult.userId,
    });

    return NextResponse.json(
      { success: true, data, message: "Pointage de sortie enregistré" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("POST /api/v2/attendance/check-out error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors du pointage de sortie", code: "SERVER_ERROR" },
      { status: 400 }
    );
  }
}
