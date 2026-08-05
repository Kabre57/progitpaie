import { EmployeeLoan } from "@/lib/domain/loan/entities/EmployeeLoan";
import { LoanDTO } from "../dto/LoanDTO";

export function toLoanDTO(
  loan: EmployeeLoan,
  userObj?: { id: string; name: string; email: string; employeeId?: string | null }
): LoanDTO {
  return {
    id: loan.id || "",
    companyId: loan.companyId,
    userId: loan.userId,
    user: userObj ? {
      id: userObj.id,
      name: userObj.name,
      email: userObj.email,
      employeeId: userObj.employeeId,
    } : undefined,
    type: loan.type.value,
    amount: loan.amount.toNumber(),
    monthlyDeduction: loan.monthlyDeduction.toNumber(),
    totalRepaid: loan.totalRepaid.toNumber(),
    remainingAmount: loan.remainingAmount.toNumber(),
    startDate: loan.startDate.toISOString().split("T")[0],
    status: loan.status.value,
    createdAt: loan.createdAt ? loan.createdAt.toISOString() : undefined,
    updatedAt: loan.updatedAt ? loan.updatedAt.toISOString() : undefined,
  };
}
