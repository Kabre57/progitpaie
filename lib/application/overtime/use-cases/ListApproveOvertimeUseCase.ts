import { OvertimeRepository, ListOvertimeQuery } from "../ports/OvertimeRepository";
import { OvertimeDTO } from "../dto/OvertimeDTO";
import { toOvertimeDTO } from "../mappers/overtime-dto.mapper";

export class ListOvertimeUseCase {
  constructor(private readonly repository: OvertimeRepository) {}

  public async execute(query: ListOvertimeQuery): Promise<readonly OvertimeDTO[]> {
    const list = await this.repository.list(query);
    return list.map((item) => toOvertimeDTO(item));
  }
}

export interface ApproveOvertimeCommand {
  companyId: string;
  adminId: string;
  overtimeId: string;
}

export class ApproveOvertimeUseCase {
  constructor(private readonly repository: OvertimeRepository) {}

  public async execute(command: ApproveOvertimeCommand): Promise<OvertimeDTO> {
    const overtime = await this.repository.findByIdForTenant(command.companyId, command.overtimeId);
    if (!overtime) {
      throw new Error("Déclaration d'heures supplémentaires non trouvée");
    }

    overtime.approve(command.adminId);
    const saved = await this.repository.save(overtime);
    return toOvertimeDTO(saved);
  }
}
