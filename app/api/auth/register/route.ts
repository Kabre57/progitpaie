import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getDefaultCompanyId } from "@/lib/database/tenant-context";

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await enforceRateLimit(request, "register", 5, 60);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const { name, email, password, department } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Check if any user exists
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return NextResponse.json(
        { success: false, error: "Registration is closed. Contact administrator to create an account.", code: "REGISTRATION_CLOSED" },
        { status: 403 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);
    const companyId = await getDefaultCompanyId();

    // Process department if provided
    let finalDepartmentId: string | null = null;
    if (department) {
      const trimmedDept = department.trim();
      const existingDept = await prisma.department.findFirst({
        where: { companyId, OR: [{ id: trimmedDept }, { name: trimmedDept }] },
      });

      if (existingDept) {
        finalDepartmentId = existingDept.id;
      } else {
        const newDept = await prisma.department.create({
          data: { name: trimmedDept, companyId },
        });
        finalDepartmentId = newDept.id;
      }
    }

    // Create first user as admin
    const newUser = await prisma.user.create({
      data: {
        companyId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: UserRole.admin,
        employeeId: null,
        departmentId: finalDepartmentId,
        leaveBalanceAnnual: 20,
        leaveBalanceSick: 10,
        leaveBalanceCasual: 5,
      },
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Admin user registered successfully",
        data: {
          user: {
            id: newUser.id,
            _id: newUser.id,
            name: newUser.name,
            role: newUser.role,
          },
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred during registration",
        code: "SERVER_ERROR",
        details: error.name || "UnknownError",
      },
      { status: 500 }
    );
  }
}
