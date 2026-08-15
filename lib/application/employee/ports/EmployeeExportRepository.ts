export interface EmployeeExportRecord {
  employeeId: string | null;
  name: string;
  email: string;
  departmentName: string | null;
  shiftName: string | null;
  salary: number;
  joiningDate: Date | null;
  isActive: boolean;
}

export interface EmployeeExportRepository {
  listActive(companyId: string): Promise<readonly EmployeeExportRecord[]>;
}
