import type { ManagerAssignmentRepository, ManagerAssignmentResult } from "../ports/ManagerAssignmentRepository";

export class AssignManagerUseCase {
  public constructor(private readonly repository: ManagerAssignmentRepository) {}

  public async execute(companyId: string, employeeId: string, managerId: string | null): Promise<ManagerAssignmentResult> {
    if (managerId === employeeId) throw new Error("CIRCULAR_MANAGER_ASSIGNMENT");
    return this.repository.assign(companyId, employeeId, managerId);
  }
}
