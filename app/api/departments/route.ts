import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware-helpers";
import { ApiResponse, CreateDepartmentBody } from "@/types";

// GET /api/departments - Get all active departments
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const departments = await prisma.department.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        manager: { select: { id: true, name: true, email: true } },
      },
      orderBy: { name: "asc" },
    });

    const formattedDepartments = departments.map((d) => ({
      ...d,
      _id: d.id,
      managerId: d.manager ? { ...d.manager, _id: d.manager.id } : d.managerId,
    }));

    return NextResponse.json(
      {
        success: true,
        data: formattedDepartments,
        message: "Departments fetched successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get departments error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch departments",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

// POST /api/departments - Create new department (admin only)
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body: CreateDepartmentBody = await request.json();

    if (!body.name || body.name.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Department name is required",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const existingDepartment = await prisma.department.findFirst({
      where: { name: { equals: body.name.trim(), mode: "insensitive" } },
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

    const department = await prisma.department.create({
      data: {
        name: body.name.trim(),
        description: body.description?.trim() || "",
        managerId: body.managerId || null,
        isActive: true,
      },
    });

    const responseData = {
      ...department,
      _id: department.id,
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
        message: "Department created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create department error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create department",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
