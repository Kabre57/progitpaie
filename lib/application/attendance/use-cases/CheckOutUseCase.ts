import { AttendanceRepository } from "../ports/AttendanceRepository";
import { AttendanceDTO } from "../dto/AttendanceDTO";
import { toAttendanceDTO } from "../mappers/attendance-dto.mapper";

export interface CheckOutCommand {
  companyId: string;
  userId: string;
  checkOutTime?: Date;
}

export class CheckOutUseCase {
  constructor(private readonly repository: AttendanceRepository) {}

  public async execute(command: CheckOutCommand): Promise<AttendanceDTO> {
    const checkOutTime = command.checkOutTime || new Date();
    const dateStr = checkOutTime.toISOString().split("T")[0];

    const attendance = await this.repository.findByUserAndDate(command.companyId, command.userId, dateStr);
    if (!attendance) {
      throw new Error("Aucun pointage d'arrivée trouvé pour aujourd'hui");
    }

    attendance.processCheckOut(checkOutTime);
    const saved = await this.repository.save(attendance);
    return toAttendanceDTO(saved);
  }
}
