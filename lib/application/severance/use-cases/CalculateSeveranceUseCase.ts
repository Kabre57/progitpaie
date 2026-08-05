import { Money } from "@/lib/domain/payroll/money";
import { TerminationType } from "@/lib/domain/severance/value-objects/TerminationType";
import { SeveranceBreakdown } from "@/lib/domain/severance/value-objects/SeveranceBreakdown";
import { SeveranceCalculation } from "@/lib/domain/severance/entities/SeveranceCalculation";
import { SeveranceRepository } from "../ports/SeveranceRepository";
import { SeveranceDTO } from "../dto/SeveranceDTO";
import { toSeveranceDTO } from "../mappers/severance-dto.mapper";

export interface CalculateSeveranceCommand {
  companyId: string;
  userId: string;
  contractId?: string;
  terminationType: string;
  exitDate: string;
  seniorityYears: number;
  noticeIndemnity?: number;
  severanceIndemnity?: number;
  leaveCompensation?: number;
  gratification13th?: number;
}

export class CalculateSeveranceUseCase {
  constructor(private readonly repository: SeveranceRepository) {}

  public async execute(command: CalculateSeveranceCommand): Promise<SeveranceDTO> {
    const terminationType = TerminationType.fromString(command.terminationType);
    const exitDate = new Date(command.exitDate);

    const breakdown = new SeveranceBreakdown(
      Money.of(command.noticeIndemnity || 0),
      Money.of(command.severanceIndemnity || 0),
      Money.of(command.leaveCompensation || 0),
      Money.of(command.gratification13th || 0)
    );

    const calculation = new SeveranceCalculation({
      companyId: command.companyId,
      userId: command.userId,
      contractId: command.contractId || null,
      terminationType,
      exitDate,
      seniorityYears: command.seniorityYears,
      breakdown,
    });

    const saved = await this.repository.save(calculation);
    return toSeveranceDTO(saved);
  }
}
