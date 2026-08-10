export interface ContractUserDTO {
  id: string;
  name: string;
  email?: string;
}

export interface ContractItemDTO {
  id: string;
  userId: string | ContractUserDTO;
  user?: ContractUserDTO;
  type: string;
  category?: string;
  jobTitle?: string;
  baseSalary?: number;
  sursalaire?: number;
  transportAllowance?: number;
  housingAllowance?: number;
  startDate?: string;
  endDate?: string | null;
  status?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeOptionDTO {
  id: string;
  name: string;
  email?: string;
  jobTitle?: string;
  category?: string;
  salary?: number;
  sursalaire?: number;
  transport?: number;
  transportAllowance?: number;
  housingAllowance?: number;
  joiningDate?: string;
  contractType?: string;
}
