import { Payroll } from "@/lib/domain/payroll/entities/Payroll";
import { PayrollPeriod } from "@/lib/domain/payroll/value-objects/PayrollPeriod";
import { EmployeeGenerationInput, AttendanceRecordInput } from "@/lib/domain/payroll/services/PayrollGenerationService";

export interface ListPayrollsQuery {
  companyId: string;
  month?: number;
  year?: number;
  status?: string;
}

export interface ListMyPayrollsQuery {
  companyId: string;
  userId: string;
  month?: number;
  year?: number;
}

export interface PayrollRepository {
  list(query: ListPayrollsQuery): Promise<readonly Payroll[]>;
  listMy(query: ListMyPayrollsQuery): Promise<readonly Payroll[]>;
  findByIdForTenant(companyId: string, id: string): Promise<Payroll | null>;
  findActiveEmployees(companyId: string): Promise<readonly EmployeeGenerationInput[]>;
  findAttendanceRecords(companyId: string, userId: string, period: PayrollPeriod): Promise<readonly AttendanceRecordInput[]>;
  findUnpaidLeaveDays(companyId: string, userId: string, period: PayrollPeriod): Promise<number>;
  existsForPeriod(companyId: string, userId: string, period: PayrollPeriod): Promise<boolean>;
  createConfigSnapshot(adminId: string): Promise<string>;
  save(payroll: Payroll): Promise<Payroll>;
  saveMany(payrolls: readonly Payroll[]): Promise<readonly Payroll[]>;
}
