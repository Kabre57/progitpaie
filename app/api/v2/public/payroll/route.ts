/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Route Publique v2 Payroll pour ERP partenaires 🔌
 * Accès par Clé API (X-API-Key: pk_live_...) — Scope requis: "read:payroll"
 * Rate limit : 120 req/min
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  authenticatePublicApi,
  getPublicApiContext,
  requireApiScope,
} from "@/lib/infrastructure/api-gateway/api-middleware";
import { ListPayrollsUseCase } from "@/lib/application/payroll/use-cases/ListPayrolls";
import { PrismaPayrollRepository } from "@/lib/infrastructure/repositories/prisma/PrismaPayrollRepository";

const listPayrollsQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  status: z.enum(["draft", "finalized"]).optional(),
});

const payrollRepository = new PrismaPayrollRepository();
const listPayrollsUseCase = new ListPayrollsUseCase(payrollRepository);

export async function GET(request: NextRequest): Promise<Response> {
  const authError = await authenticatePublicApi(request);
  if (authError) return authError;

  const scopeError = requireApiScope(request, "read:payroll");
  if (scopeError) return scopeError;

  const context = getPublicApiContext(request);
  if (!context) {
    return NextResponse.json(
      { success: false, error: "Contexte API invalide" },
      { status: 403 }
    );
  }

  const searchParams = Object.fromEntries(new URL(request.url).searchParams);
  const parsedQuery = listPayrollsQuerySchema.safeParse(searchParams);
  if (!parsedQuery.success) {
    return NextResponse.json(
      { success: false, error: "Paramètres de recherche invalides", details: parsedQuery.error.issues },
      { status: 400 }
    );
  }

  const now = new Date();
  const month = parsedQuery.data.month ?? now.getMonth() + 1;
  const year = parsedQuery.data.year ?? now.getFullYear();

  try {
    const payrolls = await listPayrollsUseCase.execute({
      companyId: context.companyId,
      month,
      year,
      status: parsedQuery.data.status,
    });

    const formattedData = payrolls.map((payroll) => ({
      id: payroll.id,
      userId: payroll.userId,
      period: `${String(payroll.month).padStart(2, "0")}/${payroll.year}`,
      basicSalary: payroll.basicSalary,
      sursalaire: payroll.sursalaire,
      grossSalary: payroll.grossSalary,
      itsTax: payroll.itsTax,
      cnpsEmployee: payroll.cnpsEmployee,
      cnpsEmployer: payroll.cnpsEmployer,
      netSalary: payroll.netSalary,
      status: payroll.status,
    }));

    return NextResponse.json({
      success: true,
      apiVersion: "2.0",
      period: { month, year },
      count: formattedData.length,
      data: formattedData,
    });
  } catch (error: unknown) {
    console.error("GET /api/v2/public/payroll error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur API v2 Payroll" },
      { status: 500 }
    );
  }
}
