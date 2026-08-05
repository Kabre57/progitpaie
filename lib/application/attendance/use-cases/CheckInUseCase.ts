import { AttendanceCalculatorService } from "@/lib/domain/attendance/services/AttendanceCalculatorService";
import { AttendanceRepository } from "../ports/AttendanceRepository";
import { AttendanceDTO } from "../dto/AttendanceDTO";
import { toAttendanceDTO } from "../mappers/attendance-dto.mapper";

export interface CheckInCommand {
  companyId: string;
  userId: string;
  checkInTime?: Date;
  location?: {
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
    distanceMeters?: number;
    isWithinFence?: boolean;
  };
  notes?: string;
}

export class CheckInUseCase {
  constructor(
    private readonly repository: AttendanceRepository,
    private readonly calculatorService: AttendanceCalculatorService = new AttendanceCalculatorService()
  ) {}

  public async execute(command: CheckInCommand): Promise<AttendanceDTO> {
    const checkInTime = command.checkInTime || new Date();
    const dateStr = checkInTime.toISOString().split("T")[0];

    const existing = await this.repository.findByUserAndDate(command.companyId, command.userId, dateStr);
    if (existing) {
      throw new Error("Vous avez déjà pointé votre arrivée aujourd'hui");
    }

    const newAttendance = this.calculatorService.createCheckIn({
      companyId: command.companyId,
      userId: command.userId,
      checkInTime,
      location: command.location,
      notes: command.notes,
    });

    const saved = await this.repository.save(newAttendance);
    return toAttendanceDTO(saved);
  }
}
