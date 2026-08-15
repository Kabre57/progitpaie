import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PayslipRepository } from "@/lib/infrastructure/repositories/payslip-repository";

const payslipRepo = new PayslipRepository();

// GET /api/payroll/bank-transfers?month=1&year=2026
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || new Date().getMonth() + 1 + "", 10);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear() + "", 10);

    const allPayrolls = await payslipRepo.findAllByPeriod(month, year);
    const payrolls = allPayrolls.filter((p) => p.user.companyId === authResult.companyId);

    type BankEmployee = {
      userId: string;
      name: string | null;
      employeeId: string;
      bankAccount: string;
      netSalary: number;
    };
    type BankSummary = {
      bankName: string;
      count: number;
      totalAmount: number;
      employees: BankEmployee[];
    };
    const bankSummaryMap: Record<string, BankSummary> = {};

    payrolls.forEach((p) => {
      const bankName = p.user?.bankName || "SOCIETE GENERALE CI";
      if (!bankSummaryMap[bankName]) {
        bankSummaryMap[bankName] = {
          bankName,
          count: 0,
          totalAmount: 0,
          employees: [],
        };
      }

      bankSummaryMap[bankName].count += 1;
      bankSummaryMap[bankName].totalAmount += Math.round(p.netSalary);
      bankSummaryMap[bankName].employees.push({
        userId: p.userId,
        name: p.user?.name,
        employeeId: p.user?.employeeId || "-",
        bankAccount: p.user?.bankAccount || "Sans RIB",
        netSalary: Math.round(p.netSalary),
      });
    });

    const bankSummaries = Object.values(bankSummaryMap);

    return NextResponse.json({
      success: true,
      data: {
        month,
        year,
        bankSummaries,
        grandTotal: bankSummaries.reduce((sum, b) => sum + b.totalAmount, 0),
        totalTransfers: bankSummaries.reduce((sum, b) => sum + b.count, 0),
      },
    });
  } catch (error) {
    console.error("Bank transfers API error:", error);
    return NextResponse.json(
      { success: false, error: "Échec de la récupération de la liste des virements bancaires" },
      { status: 500 }
    );
  }
}
