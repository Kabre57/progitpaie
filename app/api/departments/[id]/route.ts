import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware-helpers";
import { ApiResponse, CreateDepartmentBody } from "@/types";

// PUT /api/departments/[id] - Update department (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const body: Partial<CreateDepartmentBody> = await request.json();

    const department = await prisma.department.findUnique({ where: { id } });
    if (!department) {
      return NextResponse.json(
        {
          success: false,
          error: "Department not found",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    if (body.name && body.name.trim() !== department.name) {
      const existingDepartment = await prisma.department.findFirst({
        where: {
          name: { equals: body.name.trim(), mode: "insensitive" },
          NOT: { id },
        },
      });

      if (existingDepartment) {
        return NextResponse.json(
          {
            success: false,
            error: "Department with this name already exists",
            code: "DUPLICATE_ERROR",
          },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.department.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name.trim() : undefined,
        description: body.description !== undefined ? body.description.trim() : undefined,
        managerId: body.managerId !== undefined ? body.managerId || null : undefined,
      },
    });

    const responseData = {
      ...updated,
      _id: updated.id,
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
        message: "Department updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update department error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update department",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/departments/[id] - Soft delete department (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;

    const department = await prisma.department.findUnique({ where: { id } });
    if (!department) {
      return NextResponse.json(
        {
          success: false,
          error: "Department not found",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    await prisma.department.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Department deleted successfully",
        data: null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete department error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete department",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
