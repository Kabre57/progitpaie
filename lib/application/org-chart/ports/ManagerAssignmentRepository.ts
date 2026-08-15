export interface ManagerAssignmentResult {
  employeeId: string;
  employeeName: string;
  managerId: string | null;
  managerName: string | null;
}

export interface ManagerAssignmentRepository {
  assign(companyId: string, employeeId: string, managerId: string | null): Promise<ManagerAssignmentResult>;
}
