export interface OvertimeUserDTO {
  id: string;
  name: string;
  email: string;
  employeeId?: string | null;
}

export interface OvertimeDTO {
  id: string;
  companyId: string;
  userId: string;
  user?: OvertimeUserDTO;
  attendanceId?: string | null;
  date: string;
  minutes: number;
  hours: number;
  rate: number;
  reason: string;
  status: string;
  approvedById?: string | null;
  approvedBy?: { id: string; name: string } | null;
  createdAt?: string;
  updatedAt?: string;
}
