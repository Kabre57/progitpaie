import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { GeneratePayrollUseCase } from "@/lib/application/payroll/use-cases/GeneratePayroll";
import { PrismaPayrollRepository } from "@/lib/infrastructure/repositories/prisma/PrismaPayrollRepository";
import { PayslipRepository } from "@/lib/infrastructure/repositories/payslip-repository";
import { SettingsRepository } from "@/lib/infrastructure/repositories/settings-repository";
import { listPayrollsQuerySchema, generatePayrollSchema } from "@/shared/validation/payroll-v2.schema";
import {
  payrollGenerationRulesSchema,
  generatePayrollWithJustificationSchema,
  type PayrollGenerationRulesDTO,
} from "@/shared/validation/payroll-settings-v2.schema";
import { PayrollGenerationRulesService } from "@/lib/domain/payroll/services/payroll-generation-rules.service";
import { ApiResponse } from "@/types";

const repository = new PrismaPayrollRepository();
const payslipRepo = new PayslipRepository();
const settingsRepo = new SettingsRepository();
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

    const { month, year } = parseResult.data;
    const allRecords = month && year
      ? await payslipRepo.findAllByPeriod(month, year)
      : await payslipRepo.findAllByPeriod(new Date().getMonth() + 1, new Date().getFullYear());

    const records = allRecords.filter((r) => r.user.companyId === authResult.companyId);

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
  } catch (error: unknown) {
    console.error("GET /api/v2/payroll error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erreur interne", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// POST /api/v2/payroll - Génération des bulletins de paie (V2 Clean Architecture)
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const body: unknown = await request.json().catch(() => ({}));
    const parseResult = generatePayrollSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Mois et année valides requis", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { month, year } = parseResult.data;
    const justification = generatePayrollWithJustificationSchema.safeParse(body).data?.justification;

    // Récupération des règles de génération de la paie dans SettingsRepository
    const settingValue = await settingsRepo.getByKey<Record<string, unknown>>("payroll_generation_rules");

    const rules: PayrollGenerationRulesDTO = payrollGenerationRulesSchema.parse(settingValue ?? {});

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
  } catch (error: unknown) {
    console.error("POST /api/v2/payroll error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erreur lors de la génération", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
