import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
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

    // Process department if provided
    let finalDepartmentId: string | null = null;
    if (department) {
      const trimmedDept = department.trim();
      const existingDept = await prisma.department.findFirst({
        where: { OR: [{ id: trimmedDept }, { name: trimmedDept }] },
      });

      if (existingDept) {
        finalDepartmentId = existingDept.id;
      } else {
        const newDept = await prisma.department.create({
          data: { name: trimmedDept },
        });
        finalDepartmentId = newDept.id;
      }
    }

    // Create first user as admin
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: UserRole.admin,
        employeeId: "EMP-001",
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
