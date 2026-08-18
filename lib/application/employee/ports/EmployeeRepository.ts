import { Employee } from "@/lib/domain/employee/entities/Employee";

export interface ListEmployeesQuery {
  companyId: string;
  departmentId?: string;
  isActive?: boolean;
  search?: string;
}

export interface EmployeeRepository {
  list(query: ListEmployeesQuery): Promise<readonly Employee[]>;
  findByIdForTenant(companyId: string, id: string): Promise<Employee | null>;
  findByEmail(email: string): Promise<Employee | null>;
  findByEmployeeId(companyId: string, employeeId: string): Promise<Employee | null>;
  delete?(companyId: string, id: string): Promise<boolean>;
  save(employee: Employee): Promise<Employee>;
}
