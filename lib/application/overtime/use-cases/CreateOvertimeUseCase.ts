import { OvertimeRate } from "@/lib/domain/overtime/value-objects/OvertimeRate";
import { OvertimeStatus } from "@/lib/domain/overtime/value-objects/OvertimeStatus";
import { OvertimeRequest } from "@/lib/domain/overtime/entities/OvertimeRequest";
import { OvertimeRepository } from "../ports/OvertimeRepository";
import { OvertimeDTO } from "../dto/OvertimeDTO";
import { toOvertimeDTO } from "../mappers/overtime-dto.mapper";

export interface CreateOvertimeCommand {
  companyId: string;
  userId: string;
  attendanceId?: string;
  date: string;
  minutes: number;
  rate?: number;
  reason: string;
}

export class CreateOvertimeUseCase {
  constructor(private readonly repository: OvertimeRepository) {}

  public async execute(command: CreateOvertimeCommand): Promise<OvertimeDTO> {
    const dateObj = new Date(command.date);
    const rate = OvertimeRate.create(command.rate || 1.15);

    const overtime = new OvertimeRequest({
      companyId: command.companyId,
      userId: command.userId,
      attendanceId: command.attendanceId || null,
      date: dateObj,
      minutes: command.minutes,
      rate,
      reason: command.reason,
      status: OvertimeStatus.pending(),
    });

    const saved = await this.repository.save(overtime);
    return toOvertimeDTO(saved);
  }
}
