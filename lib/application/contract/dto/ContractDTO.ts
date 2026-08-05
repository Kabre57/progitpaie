export interface ContractUserDTO {
  id: string;
  name: string;
  email: string;
  employeeId?: string | null;
}

export interface ContractDTO {
  id: string;
  companyId: string;
  userId: string;
  user?: ContractUserDTO;
  type: string;
  category: string;
  jobTitle: string;
  startDate: string;
  endDate?: string | null;
  probationPeriodMonths: number;
  probationEndDate?: string | null;
  baseSalary: number;
  sursalaire: number;
  transportAllowance: number;
  housingAllowance: number;
  totalMonthlyCompensation: number;
  documentUrl?: string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}
