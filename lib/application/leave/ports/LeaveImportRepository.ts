export type ImportedLeaveType = "annual" | "sick" | "casual" | "unpaid";
export type ImportedLeaveStatus = "pending" | "approved" | "rejected";

export interface LeaveImportEmployee {
  id: string;
  employeeId: string | null;
  email: string;
}

export interface CreateImportedLeaveInput {
  companyId: string;
  userId: string;
  leaveType: ImportedLeaveType;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: ImportedLeaveStatus;
  approvedById?: string;
}

export interface LeaveImportRepository {
  listEmployees(companyId: string): Promise<readonly LeaveImportEmployee[]>;
  createEmployee(companyId: string, employeeId: string, name: string): Promise<LeaveImportEmployee>;
  createLeave(input: CreateImportedLeaveInput): Promise<void>;
}
