import { WorkContract } from "@/lib/domain/contract/entities/WorkContract";
import { ContractDTO } from "../dto/ContractDTO";

export function toContractDTO(
  contract: WorkContract,
  userObj?: { id: string; name: string; email: string; employeeId?: string | null }
): ContractDTO {
  const probationEnd = contract.calculateProbationEndDate();
  return {
    id: contract.id || "",
    companyId: contract.companyId,
    userId: contract.userId,
    user: userObj ? {
      id: userObj.id,
      name: userObj.name,
      email: userObj.email,
      employeeId: userObj.employeeId,
    } : undefined,
    type: contract.type.value,
    category: contract.category.value,
    jobTitle: contract.jobTitle,
    startDate: contract.startDate.toISOString().split("T")[0],
    endDate: contract.endDate ? contract.endDate.toISOString().split("T")[0] : null,
    probationPeriodMonths: contract.probationPeriodMonths,
    probationEndDate: probationEnd ? probationEnd.toISOString().split("T")[0] : null,
    baseSalary: contract.baseSalary.toNumber(),
    sursalaire: contract.sursalaire.toNumber(),
    transportAllowance: contract.transportAllowance.toNumber(),
    housingAllowance: contract.housingAllowance.toNumber(),
    totalMonthlyCompensation: contract.calculateTotalMonthlyCompensation().toNumber(),
    documentUrl: contract.documentUrl,
    status: contract.status,
    createdAt: contract.createdAt ? contract.createdAt.toISOString() : undefined,
    updatedAt: contract.updatedAt ? contract.updatedAt.toISOString() : undefined,
  };
}
