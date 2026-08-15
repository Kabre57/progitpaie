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

export interface ReviewOvertimeCommand extends ApproveOvertimeCommand {
  action: "approve" | "reject";
  justification?: string;
}

export class ReviewOvertimeUseCase {
  public constructor(
    private readonly repository: OvertimeRepository,
    private readonly now: () => Date = () => new Date()
  ) {}

  public async execute(command: ReviewOvertimeCommand): Promise<OvertimeDTO> {
    const overtime = await this.repository.findByIdForTenant(command.companyId, command.overtimeId);
    if (!overtime) throw new Error("OVERTIME_NOT_FOUND");

    const currentMonth = `${this.now().getFullYear()}-${String(this.now().getMonth() + 1).padStart(2, "0")}`;
    const overtimeMonth = overtime.date.toISOString().slice(0, 7);
    const justification = command.justification?.trim();
    if (command.action === "approve" && overtimeMonth < currentMonth && (!justification || justification.length < 5)) {
      throw new Error("OVERTIME_JUSTIFICATION_REQUIRED");
    }

    if (command.action === "reject") {
      overtime.reject(command.adminId, justification);
    } else {
      overtime.approve(command.adminId, justification);
    }

    return toOvertimeDTO(await this.repository.save(overtime));
  }
}
