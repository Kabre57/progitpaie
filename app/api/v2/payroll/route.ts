import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { prisma } from "@/lib/db";
import { GeneratePayrollUseCase } from "@/lib/application/payroll/use-cases/GeneratePayroll";
import { PrismaPayrollRepository } from "@/lib/infrastructure/repositories/prisma/PrismaPayrollRepository";
import { listPayrollsQuerySchema, generatePayrollSchema } from "@/shared/validation/payroll-v2.schema";
import { PayrollGenerationRulesDTO } from "@/shared/validation/payroll-settings-v2.schema";
import { PayrollGenerationRulesService } from "@/lib/domain/payroll/services/payroll-generation-rules.service";
import { ApiResponse } from "@/types";

const repository = new PrismaPayrollRepository();
const generateUseCase = new GeneratePayrollUseCase(repository);

// GET /api/v2/payroll - Liste des bulletins de paie avec informations salarié
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const parseResult = listPayrollsQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Paramètres de requête invalides", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const records = await prisma.payroll.findMany({
      where: {
        companyId: authResult.companyId,
        user: { role: "employee" },
        ...(parseResult.data.month ? { month: parseResult.data.month } : {}),
        ...(parseResult.data.year ? { year: parseResult.data.year } : {}),
        ...(parseResult.data.status ? { status: parseResult.data.status as any } : {}),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, employeeId: true },
        },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    const data = records.map((r) => ({
      id: r.id,
      _id: r.id,
      companyId: r.companyId,
      userId: {
        _id: r.user.id,
        id: r.user.id,
        name: r.user.name,
        email: r.user.email,
        employeeId: r.user.employeeId || undefined,
      },
      user: {
        id: r.user.id,
        name: r.user.name,
        email: r.user.email,
        employeeId: r.user.employeeId || undefined,
      },
      month: r.month,
      year: r.year,
      status: r.status,
      basicSalary: r.basicSalary,
      sursalaire: r.sursalaire,
      transportAllowance: r.transportAllowance,
      housingAllowance: r.housingAllowance,
      overtimePay: r.overtimePay,
      bonuses: r.bonuses,
      presentDays: r.presentDays,
      absentDays: r.absentDays,
      lateDays: r.lateDays,
      leaveDays: r.leaveDays,
      unpaidLeaveDays: r.unpaidLeaveDays,
      absentDeduction: r.absentDeduction,
      lateDeduction: r.lateDeduction,
      unpaidLeaveDeduction: r.unpaidLeaveDeduction,
      grossSalary: r.grossSalary,
      itsTax: r.itsTax,
      igrTax: r.igrTax,
      cnpsEmployee: r.cnpsEmployee,
      cnpsEmployer: r.cnpsEmployer,
      fdfpTax: r.fdfpTax,
      totalDeductions: r.totalDeductions,
      netSalary: r.netSalary,
      configSnapshotId: r.configSnapshotId,
      finalizedAt: r.finalizedAt ? r.finalizedAt.toISOString() : null,
      createdAt: r.createdAt ? r.createdAt.toISOString() : undefined,
      updatedAt: r.updatedAt ? r.updatedAt.toISOString() : undefined,
    }));

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/v2/payroll error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur interne", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// POST /api/v2/payroll - Génération des bulletins de paie (V2 Clean Architecture)
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json().catch(() => ({}));
    const parseResult = generatePayrollSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Mois et année valides requis", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { month, year } = parseResult.data;
    const justification = typeof body.justification === "string" ? body.justification : undefined;

    // Récupération des règles de génération de la paie dans CompanySettings
    const settingRecord = await prisma.companySettings.findUnique({
      where: { companyId_key: { companyId: authResult.companyId, key: "payroll_generation_rules" } },
    });

    const rules: PayrollGenerationRulesDTO = {
      startDayOfMonth: 25,
      allowEarlyGenerationWithReason: true,
      minJustificationLength: 10,
      ...(settingRecord?.value ? (settingRecord.value as any) : {}),
    };

    const check = PayrollGenerationRulesService.checkGenerationAllowed(month, year, rules, justification);

    if (!check.isAllowed) {
      return NextResponse.json(
        {
          success: false,
          error: check.errorReason || "Génération non autorisée pour cette période",
          code: "EARLY_PAYROLL_RESTRICTION",
          requiresJustification: check.requiresJustification,
          isEarly: check.isEarly,
          startDayOfMonth: rules.startDayOfMonth,
        },
        { status: 400 }
      );
    }

    // Si génération anticipée sur justification, journaliser dans les logs d'audit
    if (check.isEarly && justification) {
      await prisma.auditLog.create({
        data: {
          companyId: authResult.companyId,
          performedById: authResult.userId,
          action: "EARLY_PAYROLL_GENERATION",
          targetModel: "Payroll",
          newValues: { month, year, justification },
        },
      }).catch(() => null);
    }

    const result = await generateUseCase.execute({
      companyId: authResult.companyId,
      adminId: authResult.userId,
      month,
      year,
    });

    return NextResponse.json(
      {
        success: true,
        data: { generated: result.generated, errors: result.errors.length > 0 ? result.errors : undefined },
        message: `Génération effectuée pour ${result.generated} salariés`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/v2/payroll error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la génération", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
