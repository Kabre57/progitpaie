/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Public API v1 Employees Endpoint (/api/v1/employees) 🔌
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticatePublicApi } from "@/lib/infrastructure/api-gateway/api-middleware";
import { EmployeeRepository } from "@/lib/infrastructure";

const employeeRepo = new EmployeeRepository();

export async function GET(request: NextRequest): Promise<Response> {
  const authError = await authenticatePublicApi(request);
  if (authError) return authError;

  try {
    const employees = await employeeRepo.findAllActive();

    return NextResponse.json({
      success: true,
      apiVersion: "1.0",
      count: employees.length,
      data: employees,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Erreur serveur API v1 Employees" },
      { status: 500 }
    );
  }
}
