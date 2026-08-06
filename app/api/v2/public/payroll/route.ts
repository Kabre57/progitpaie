/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Route Publique v2 Payroll pour ERP partenaires 🔌
 * Accès par Clé API (X-API-Key: pk_live_...) — Rate limit : 120 req/min
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticatePublicApi } from "@/lib/infrastructure/api-gateway/api-middleware";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest): Promise<Response> {
  // 1. Authentification par clé API
  const authError = await authenticatePublicApi(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || `${new Date().getMonth() + 1}`, 10);
    const year = parseInt(searchParams.get("year") || `${new Date().getFullYear()}`, 10);
    const status = searchParams.get("status") || undefined;

    const payrolls = await prisma.payroll.findMany({
      where: {
        month,
        year,
        ...(status && { status: status as any }),
      },
      select: {
        id: true,
        month: true,
        year: true,
        basicSalary: true,
        sursalaire: true,
        grossSalary: true,
        itsTax: true,
        cnpsEmployee: true,
        cnpsEmployer: true,
        netSalary: true,
        status: true,
        user: {
          select: {
            id: true,
            name: true,
            employeeId: true,
            jobTitle: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    const formattedData = payrolls.map((p) => ({
      id: p.id,
      employeeId: p.user?.employeeId || "N/A",
      employeeName: p.user?.name || "Salarié",
      jobTitle: p.user?.jobTitle || null,
      department: p.user?.department?.name || null,
      period: `${p.month < 10 ? "0" + p.month : p.month}/${p.year}`,
      basicSalary: p.basicSalary,
      sursalaire: p.sursalaire,
      grossSalary: p.grossSalary,
      itsTax: p.itsTax,
      cnpsEmployee: p.cnpsEmployee,
      cnpsEmployer: p.cnpsEmployer,
      netSalary: p.netSalary,
      status: p.status,
    }));

    return NextResponse.json({
      success: true,
      apiVersion: "2.0",
      period: { month, year },
      count: formattedData.length,
      data: formattedData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Erreur serveur API v2 Payroll" },
      { status: 500 }
    );
  }
}
