import { PayrollPeriod } from "@/lib/domain/payroll/value-objects/PayrollPeriod";
import { PayrollGenerationService } from "@/lib/domain/payroll/services/PayrollGenerationService";
import { PayrollRepository } from "../ports/PayrollRepository";
import { PayrollDTO } from "../dto/PayrollDTO";
import { toPayrollDTO } from "../mappers/payroll-dto.mapper";

export interface GeneratePayrollCommand {
  companyId: string;
  adminId: string;
  month: number;
  year: number;
}

export interface GeneratePayrollResult {
  generated: number;
  errors: string[];
  payrolls: readonly PayrollDTO[];
}

export class GeneratePayrollUseCase {
  constructor(
    private readonly repository: PayrollRepository,
    private readonly generationService: PayrollGenerationService = new PayrollGenerationService()
  ) {}

  public async execute(command: GeneratePayrollCommand): Promise<GeneratePayrollResult> {
    const period = PayrollPeriod.create(command.month, command.year);
    const employees = await this.repository.findActiveEmployees(command.companyId);

    const configSnapshotId = await this.repository.createConfigSnapshot(command.adminId);

    const payrollsToSave = [];
    const errors: string[] = [];

    for (const employee of employees) {
      try {
        const exists = await this.repository.existsForPeriod(command.companyId, employee.id, period);
        if (exists) {
          continue;
        }

        const attendance = await this.repository.findAttendanceRecords(command.companyId, employee.id, period);
        const unpaidLeaveDays = await this.repository.findUnpaidLeaveDays(command.companyId, employee.id, period);

        const payroll = this.generationService.generateForEmployee(
          employee,
          period,
          attendance,
          unpaidLeaveDays,
          configSnapshotId
        );

        payrollsToSave.push(payroll);
      } catch (err) {
        errors.push(`${employee.id}: ${err instanceof Error ? err.message : "Erreur de génération"}`);
      }
    }

    const savedPayrolls = await this.repository.saveMany(payrollsToSave);

    return {
      generated: savedPayrolls.length,
      errors,
      payrolls: savedPayrolls.map((p) => toPayrollDTO(p)),
    };
  }
}
