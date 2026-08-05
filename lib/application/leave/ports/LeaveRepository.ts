import { LeaveRequest } from "@/lib/domain/leave/entities/LeaveRequest";

export interface ListLeavesQuery {
  companyId: string;
  userId?: string;
  status?: string;
  leaveType?: string;
  startDate?: string;
  endDate?: string;
}

export interface LeaveRepository {
  list(query: ListLeavesQuery): Promise<readonly LeaveRequest[]>;
  findByIdForTenant(companyId: string, id: string): Promise<LeaveRequest | null>;
  save(leave: LeaveRequest): Promise<LeaveRequest>;
}
