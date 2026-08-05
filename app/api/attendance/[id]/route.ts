import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaAttendanceRepository } from "@/lib/infrastructure/repositories/prisma/PrismaAttendanceRepository";
import { OverrideAttendanceStatusUseCase } from "@/lib/application/attendance/use-cases/OverrideAttendanceStatusUseCase";
import { toAttendanceDTO } from "@/lib/application/attendance/mappers/attendance-dto.mapper";
import { overrideAttendanceStatusSchema } from "@/shared/validation/attendance-v2.schema";
import { ApiResponse } from "@/types";

const repository = new PrismaAttendanceRepository();
const overrideUseCase = new OverrideAttendanceStatusUseCase(repository);

const DEPRECATION_HEADERS: Record<string, string> = {
  Deprecated: "true",
  Deprecation: "true",
  Link: '</api/v2/attendance/[id]>; rel="successor-version"',
  "Cache-Control": "private, no-store, max-age=0",
};

function withDeprecation<T>(response: NextResponse<T>): NextResponse<T> {
  Object.entries(DEPRECATION_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

// PUT /api/attendance/[id] - Override status (Legacy Adaptateur V1 -> V2)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return withDeprecation(authResult);

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const parseResult = overrideAttendanceStatusSchema.safeParse(body);
    if (!parseResult.success) {
      return withDeprecation(
        NextResponse.json(
          { success: false, error: "Status is required", code: "VALIDATION_ERROR" },
          { status: 400 }
        )
      );
    }

    const updated = await overrideUseCase.execute({
      companyId: authResult.companyId,
      adminId: authResult.userId,
      attendanceId: id,
      newStatus: parseResult.data.status,
      notes: parseResult.data.notes,
    });

    const legacyData = {
      ...updated,
      _id: updated.id,
      userId: updated.user ? { ...updated.user, _id: updated.user.id } : updated.userId,
    };

    return withDeprecation(
      NextResponse.json(
        { success: true, data: legacyData, message: "Attendance status updated" },
        { status: 200 }
      )
    );
  } catch (error: any) {
    console.error("Attendance override error:", error);
    const status = error.message.includes("non trouvé") ? 404 : 500;
    return withDeprecation(
      NextResponse.json(
        { success: false, error: error.message || "Failed to update attendance", code: "SERVER_ERROR" },
        { status }
      )
    );
  }
}

// GET /api/attendance/[id] - Get single attendance (Legacy Adaptateur V1 -> V2)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return withDeprecation(authResult);

    const { id } = await params;
    const attendance = await repository.findByIdForTenant(authResult.companyId, id);
    if (!attendance) {
      return withDeprecation(
        NextResponse.json(
          { success: false, error: "Attendance record not found", code: "NOT_FOUND" },
          { status: 404 }
        )
      );
    }

    const dto = toAttendanceDTO(attendance);
    const legacyData = {
      ...dto,
      _id: dto.id,
      userId: dto.user ? { ...dto.user, _id: dto.user.id } : dto.userId,
    };

    return withDeprecation(NextResponse.json({ success: true, data: legacyData }, { status: 200 }));
  } catch (error: any) {
    console.error("Get attendance error:", error);
    return withDeprecation(
      NextResponse.json(
        { success: false, error: "Failed to fetch attendance", code: "SERVER_ERROR" },
        { status: 500 }
      )
    );
  }
}
