import { z } from "zod";
import { createEmployeeSchema, updateEmployeeSchema } from "@/lib/validators/employee.schema";

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

export interface EmployeeDepartmentDTO {
  id?: string;
  name: string;
}

export interface EmployeeDTO {
  id: string;
  _id?: string;
  employeeId?: string;
  name: string;
  email: string;
  civility?: string;
  gender?: string;
  birthDate?: string;
  birthPlace?: string;
  idCardType?: string;
  idCardNumber?: string;
  nationality?: string;
  maritalStatus?: string;
  childrenCount?: number | string;
  address?: string;
  phone?: string;
  contractType?: string;
  contractSignDate?: string;
  cddDurationMonths?: number | string;
  joiningDate?: string;
  exitDate?: string;
  direction?: string;
  service?: string;
  jobTitle?: string;
  jobCode?: string;
  regime?: string;
  paymentType?: string;
  category?: string;
  cnpsExempt?: boolean;
  cnpsNumber?: string;
  paymentMethod?: string;
  bankAccount?: string;
  bankName?: string;
  salary?: number | string;
  sursalaire?: number | string;
  departmentId?: string | null;
  department?: EmployeeDepartmentDTO | null;
  isActive?: boolean;
}

export interface EmployeesApiResponseDTO {
  success?: boolean;
  data: EmployeeDTO[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
