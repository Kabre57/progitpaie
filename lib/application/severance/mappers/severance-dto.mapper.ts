import { SeveranceCalculation } from "@/lib/domain/severance/entities/SeveranceCalculation";
import { SeveranceDTO } from "../dto/SeveranceDTO";

export function toSeveranceDTO(
  severance: SeveranceCalculation,
  userObj?: { id: string; name: string; email: string; employeeId?: string | null }
): SeveranceDTO {
  return {
    id: severance.id || "",
    companyId: severance.companyId,
    userId: severance.userId,
    user: userObj ? {
      id: userObj.id,
      name: userObj.name,
      email: userObj.email,
      employeeId: userObj.employeeId,
    } : undefined,
    contractId: severance.contractId || null,
    terminationType: severance.terminationType.value,
    exitDate: severance.exitDate.toISOString().split("T")[0],
    seniorityYears: severance.seniorityYears,
    noticeIndemnity: severance.breakdown.noticeIndemnity.toNumber(),
    severanceIndemnity: severance.breakdown.severanceIndemnity.toNumber(),
    leaveCompensation: severance.breakdown.leaveCompensation.toNumber(),
    gratification13th: severance.breakdown.gratification13th.toNumber(),
    totalNetExit: severance.totalNetExit.toNumber(),
    createdAt: severance.createdAt ? severance.createdAt.toISOString() : undefined,
    updatedAt: severance.updatedAt ? severance.updatedAt.toISOString() : undefined,
  };
}
