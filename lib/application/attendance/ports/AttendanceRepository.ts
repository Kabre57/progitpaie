import { Attendance } from "@/lib/domain/attendance/entities/Attendance";

export interface ListAttendanceQuery {
  companyId: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  departmentId?: string;
}

export interface TodaySummaryDTO {
  totalEmployees: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  onLeaveCount: number;
}

export interface AttendanceRepository {
  list(query: ListAttendanceQuery): Promise<readonly Attendance[]>;
  findByIdForTenant(companyId: string, id: string): Promise<Attendance | null>;
  findByUserAndDate(companyId: string, userId: string, date: string): Promise<Attendance | null>;
  getTodaySummary(companyId: string, date: string): Promise<TodaySummaryDTO>;
  save(attendance: Attendance): Promise<Attendance>;
}
