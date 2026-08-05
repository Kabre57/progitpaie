import { PayrollRepository } from "../ports/PayrollRepository";
import { NotificationPort } from "../ports/NotificationPort";
import { PayrollDTO } from "../dto/PayrollDTO";
import { toPayrollDTO } from "../mappers/payroll-dto.mapper";

export interface FinalizePayrollCommand {
  companyId: string;
  payrollId: string;
}

export class FinalizePayrollUseCase {
  constructor(
    private readonly repository: PayrollRepository,
    private readonly notificationPort?: NotificationPort
  ) {}

  public async execute(command: FinalizePayrollCommand): Promise<PayrollDTO> {
    const payroll = await this.repository.findByIdForTenant(command.companyId, command.payrollId);
    if (!payroll) {
      throw new Error("Bulletin de paie non trouvé");
    }

    payroll.finalize(new Date());
    const saved = await this.repository.save(payroll);

    if (this.notificationPort) {
      await this.notificationPort.notifyPayslipFinalized(
        saved.userId,
        saved.period.month,
        saved.period.year
      );
    }

    return toPayrollDTO(saved);
  }
}
