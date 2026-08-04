import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/database/tenant-context";
import { hashPassword } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { ApiResponse } from "@/types";

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

// Helper function to generate unique employee ID
async function generateEmployeeId(): Promise<string> {
  const count = await prisma.user.count();
  const nextNumber = count + 1;
  return `EMP-${String(nextNumber).padStart(3, "0")}`;
}

// POST /api/employees/import - Bulk import employees from CSV
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ImportResult>>> {
  try {
    // Check admin authorization
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "CSV file is required",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    // Read file content
    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: "CSV file must have a header row and at least one data row",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    // Parse header
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const nameIdx = headers.indexOf("name");
    const emailIdx = headers.indexOf("email");
    const passwordIdx = headers.indexOf("password");
    const deptIdx = headers.indexOf("department");
    const shiftIdx = headers.indexOf("shift");
    const salaryIdx = headers.indexOf("salary");
    const dateIdx = headers.indexOf("joiningdate");

    if (nameIdx === -1 || emailIdx === -1 || passwordIdx === -1) {
      return NextResponse.json(
        {
          success: false,
          error: "CSV must have 'name', 'email', and 'password' columns",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const result: ImportResult = {
      imported: 0,
      skipped: 0,
      errors: [],
    };

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      if (!row.trim()) continue;

      // Parse CSV row (handle quoted values)
      const values: string[] = [];
      let current = "";
      let inQuotes = false;

      for (const char of row) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const name = values[nameIdx]?.trim();
      const email = values[emailIdx]?.trim().toLowerCase();
      const password = values[passwordIdx]?.trim();
      const department = values[deptIdx]?.trim() || undefined;
      const shift = values[shiftIdx]?.trim() || undefined;
      const salary = values[salaryIdx]?.trim();
      const joiningDate = values[dateIdx]?.trim();

      // Validate row
      if (!name || !email || !password) {
        result.skipped++;
        result.errors.push(`Row ${i}: Missing required fields`);
        continue;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        result.skipped++;
        result.errors.push(`Row ${i}: Invalid email format (${email})`);
        continue;
      }

      try {
        // Check if email already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
          result.skipped++;
          result.errors.push(`Row ${i}: Email already exists (${email})`);
          continue;
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Generate employee ID
        const employeeId = await generateEmployeeId();

        // Process department if provided
        let finalDepartmentId: string | null = null;
        if (department) {
          const deptDoc = await prisma.department.findFirst({
            where: { companyId: authResult.companyId, OR: [{ id: department }, { name: department }] },
          });
          if (deptDoc) {
            finalDepartmentId = deptDoc.id;
          }
        }

        // Process shift if provided
        let finalShiftId: string | null = null;
        if (shift) {
          const shiftDoc = await prisma.shift.findFirst({
            where: { companyId: authResult.companyId, OR: [{ id: shift }, { name: shift }] },
          });
          if (shiftDoc) {
            finalShiftId = shiftDoc.id;
          }
        }

        // Create user
        await prisma.user.create({
          data: {
            companyId: authResult.companyId,
            name,
            email,
            password: hashedPassword,
            role: UserRole.employee,
            employeeId,
            departmentId: finalDepartmentId,
            shiftId: finalShiftId,
            salary: salary ? parseFloat(salary) : 0,
            joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
            isActive: true,
            leaveBalanceAnnual: 20,
            leaveBalanceSick: 10,
            leaveBalanceCasual: 5,
          },
        });

        result.imported++;
      } catch (err) {
        result.skipped++;
        result.errors.push(`Row ${i}: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: `Import complete: ${result.imported} imported, ${result.skipped} skipped`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Import employees error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to import employees",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
