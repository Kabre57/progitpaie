export interface PayrollUserDTO {
  id: string;
  name: string;
  email: string;
  employeeId?: string | null;
}

export interface PayrollDTO {
  id: string;
  companyId: string;
  userId: string;
  user?: PayrollUserDTO;
  month: number;
  year: number;
  status: "draft" | "finalized";
  basicSalary: number;
  sursalaire: number;
  transportAllowance: number;
  housingAllowance: number;
  overtimePay: number;
  bonuses: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  leaveDays: number;
  unpaidLeaveDays: number;
  absentDeduction: number;
  lateDeduction: number;
  unpaidLeaveDeduction: number;
  grossSalary: number;
  itsTax: number;
  igrTax: number;
  cnpsEmployee: number;
  cnpsEmployer: number;
  fdfpTax: number;
  totalDeductions: number;
  netSalary: number;
  configSnapshotId?: string | null;
  finalizedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
