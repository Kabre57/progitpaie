/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Public API v1 Payroll Endpoint (/api/v1/payroll) 🔌
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticatePublicApi } from "@/lib/infrastructure/api-gateway/api-middleware";
import { PayslipRepository } from "@/lib/infrastructure";

const payslipRepo = new PayslipRepository();

export async function GET(request: NextRequest): Promise<Response> {
  const authError = await authenticatePublicApi(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || new Date().getMonth() + 1 + "", 10);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear() + "", 10);

    const payrolls = await payslipRepo.findAllByPeriod(month, year);

    const formattedData = payrolls.map((p) => ({
      id: p.id,
      employeeId: p.user?.employeeId || "EMP",
      employeeName: p.user?.name || "Salarié",
      period: `${p.month < 10 ? "0" + p.month : p.month}/${p.year}`,
      basicSalary: p.basicSalary,
      sursalaire: p.sursalaire,
      grossSalary: p.grossSalary,
      itsTax: p.itsTax,
      cnpsEmployee: p.cnpsEmployee,
      netSalary: p.netSalary,
      status: p.status,
    }));

    return NextResponse.json({
      success: true,
      apiVersion: "1.0",
      period: { month, year },
      count: formattedData.length,
      data: formattedData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Erreur serveur API v1 Payroll" },
      { status: 500 }
    );
  }
}
