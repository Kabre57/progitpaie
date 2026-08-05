export interface EmployeeDTO {
  id: string;
  companyId: string;
  employeeId?: string | null;
  name: string;
  email: string;
  role: string;
  departmentId?: string | null;
  departmentName?: string | null;
  shiftId?: string | null;
  shiftName?: string | null;
  salary: number;
  sursalaire: number;
  transportAllowance: number;
  housingAllowance: number;
  partsIGR: number;
  cnpsNumber?: string | null;
  idCardNumber?: string | null;
  bankAccount?: string | null;
  bankName?: string | null;
  paymentMethod: string;
  joiningDate?: string | null;
  seniorityMonths?: number;
  seniorityYears?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
