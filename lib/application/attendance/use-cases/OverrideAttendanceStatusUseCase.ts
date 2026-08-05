import { AttendanceStatus } from "@/lib/domain/attendance/value-objects/AttendanceStatus";
import { AttendanceRepository } from "../ports/AttendanceRepository";
import { AttendanceDTO } from "../dto/AttendanceDTO";
import { toAttendanceDTO } from "../mappers/attendance-dto.mapper";

export interface OverrideAttendanceCommand {
  companyId: string;
  adminId: string;
  attendanceId: string;
  newStatus: string;
  notes?: string;
}

export class OverrideAttendanceStatusUseCase {
  constructor(private readonly repository: AttendanceRepository) {}

  public async execute(command: OverrideAttendanceCommand): Promise<AttendanceDTO> {
    const attendance = await this.repository.findByIdForTenant(command.companyId, command.attendanceId);
    if (!attendance) {
      throw new Error("Enregistrement de pointage non trouvé");
    }

    const domainStatus = AttendanceStatus.fromString(command.newStatus);
    attendance.overrideStatus(domainStatus, command.adminId, command.notes);

    const saved = await this.repository.save(attendance);
    return toAttendanceDTO(saved);
  }
}
