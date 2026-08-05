import { Money } from "@/lib/domain/payroll/money";
import { ContractType } from "@/lib/domain/contract/value-objects/ContractType";
import { EmployeeCategory } from "@/lib/domain/contract/value-objects/EmployeeCategory";
import { WorkContract } from "@/lib/domain/contract/entities/WorkContract";
import { ContractRepository } from "../ports/ContractRepository";
import { ContractDTO } from "../dto/ContractDTO";
import { toContractDTO } from "../mappers/contract-dto.mapper";

export interface CreateContractCommand {
  companyId: string;
  userId: string;
  type: string;
  category?: string;
  jobTitle: string;
  startDate: string;
  endDate?: string;
  probationPeriodMonths?: number;
  baseSalary: number;
  sursalaire?: number;
  transportAllowance?: number;
  housingAllowance?: number;
  documentUrl?: string;
}

export class CreateContractUseCase {
  constructor(private readonly repository: ContractRepository) {}

  public async execute(command: CreateContractCommand): Promise<ContractDTO> {
    const type = ContractType.fromString(command.type);
    const category = EmployeeCategory.fromString(command.category || "employe");
    const startDate = new Date(command.startDate);
    const endDate = command.endDate ? new Date(command.endDate) : null;

    const contract = new WorkContract({
      companyId: command.companyId,
      userId: command.userId,
      type,
      category,
      jobTitle: command.jobTitle,
      startDate,
      endDate,
      probationPeriodMonths: command.probationPeriodMonths || 0,
      baseSalary: Money.of(command.baseSalary),
      sursalaire: Money.of(command.sursalaire || 0),
      transportAllowance: Money.of(command.transportAllowance || 0),
      housingAllowance: Money.of(command.housingAllowance || 0),
      documentUrl: command.documentUrl,
    });

    const saved = await this.repository.save(contract);
    return toContractDTO(saved);
  }
}
