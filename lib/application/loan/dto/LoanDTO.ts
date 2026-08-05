export interface LoanUserDTO {
  id: string;
  name: string;
  email: string;
  employeeId?: string | null;
}

export interface LoanDTO {
  id: string;
  companyId: string;
  userId: string;
  user?: LoanUserDTO;
  type: string;
  amount: number;
  monthlyDeduction: number;
  totalRepaid: number;
  remainingAmount: number;
  startDate: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}
