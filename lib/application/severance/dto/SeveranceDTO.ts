export interface SeveranceUserDTO {
  id: string;
  name: string;
  email: string;
  employeeId?: string | null;
}

export interface SeveranceDTO {
  id: string;
  companyId: string;
  userId: string;
  user?: SeveranceUserDTO;
  contractId?: string | null;
  terminationType: string;
  exitDate: string;
  seniorityYears: number;
  noticeIndemnity: number;
  severanceIndemnity: number;
  leaveCompensation: number;
  gratification13th: number;
  totalNetExit: number;
  createdAt?: string;
  updatedAt?: string;
}
