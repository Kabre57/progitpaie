import { Money } from "@/lib/domain/payroll/money";
import { PayrollRepository } from "../ports/PayrollRepository";
import { PayrollDTO } from "../dto/PayrollDTO";
import { toPayrollDTO } from "../mappers/payroll-dto.mapper";

export interface UpdatePayrollBonusesCommand {
  companyId: string;
  payrollId: string;
  bonuses: number;
}

export class UpdatePayrollBonusesUseCase {
  constructor(private readonly repository: PayrollRepository) {}

  public async execute(command: UpdatePayrollBonusesCommand): Promise<PayrollDTO> {
    const payroll = await this.repository.findByIdForTenant(command.companyId, command.payrollId);
    if (!payroll) {
      throw new Error("Bulletin de paie non trouvé");
    }

    payroll.updateBonuses(Money.of(command.bonuses));
    const saved = await this.repository.save(payroll);
    return toPayrollDTO(saved);
  }
}
