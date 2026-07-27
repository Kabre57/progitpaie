import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { ApiResponse } from "@/types";

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    // Check if any admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: UserRole.admin },
    });

    if (existingAdmin) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Admin user already exists. Seeding not required.",
        },
        { status: 409 }
      );
    }

    // Create default admin user
    const adminPassword = "admin123";
    const hashedPassword = await hashPassword(adminPassword);

    const adminUser = await prisma.user.create({
      data: {
        name: "Admin",
        email: "admin@attendance.com",
        password: hashedPassword,
        role: UserRole.admin,
        employeeId: "EMP-001",
        leaveBalanceAnnual: 20,
        leaveBalanceSick: 10,
        leaveBalanceCasual: 5,
      },
    });

    return NextResponse.json<ApiResponse<unknown>>(
      {
        success: true,
        message: "Default admin user created successfully",
        data: {
          id: adminUser.id,
          _id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
          departmentId: adminUser.departmentId,
          createdAt: adminUser.createdAt,
          note: "Default password is 'admin123'. Please change it after first login.",
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
