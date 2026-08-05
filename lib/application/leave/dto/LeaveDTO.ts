export interface LeaveUserDTO {
  id: string;
  name: string;
  email: string;
  employeeId?: string | null;
}

export interface LeaveDTO {
  id: string;
  companyId: string;
  userId: string;
  user?: LeaveUserDTO;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  approvedById?: string | null;
  approvedBy?: { id: string; name: string } | null;
  adminComment: string;
  appliedAt: string;
  createdAt?: string;
  updatedAt?: string;
}
