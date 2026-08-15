export type AttendanceImportStatus = "present" | "absent" | "late" | "half_day" | "on_leave";

export interface AttendanceImportEmployee {
  id: string;
  employeeId: string | null;
  email: string;
}

export interface UpsertAttendanceImportInput {
  companyId: string;
  userId: string;
  date: string;
  status: AttendanceImportStatus;
  checkIn: Date;
  checkOut: Date | null;
  hoursWorked: number;
  workingMinutes: number;
  overtimeMinutes: number;
  notes?: string;
}

export interface UpsertImportedOvertimeInput {
  companyId: string;
  userId: string;
  date: Date;
  minutes: number;
  rate: number;
  reason: string;
}

export interface AttendanceImportRepository {
  listEmployees(companyId: string): Promise<readonly AttendanceImportEmployee[]>;
  createEmployee(companyId: string, employeeId: string, name: string): Promise<AttendanceImportEmployee>;
  upsertAttendance(input: UpsertAttendanceImportInput): Promise<void>;
  upsertOvertime(input: UpsertImportedOvertimeInput): Promise<void>;
}
