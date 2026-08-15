export interface AttendanceExportEmployee {
  id: string;
  name: string;
  employeeId: string | null;
  departmentName: string | null;
}

export interface AttendanceExportEntry {
  userId: string;
  date: string;
  checkIn: Date | null;
  checkOut: Date | null;
  status: string;
  hoursWorked: number | null;
}

export interface AttendanceExportRepository {
  list(companyId: string, departmentId: string | undefined, startDate: string, endDate: string): Promise<{
    employees: readonly AttendanceExportEmployee[];
    records: readonly AttendanceExportEntry[];
  }>;
}
