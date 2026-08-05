import { AttendanceRepository, ListAttendanceQuery } from "../ports/AttendanceRepository";
import { AttendanceDTO } from "../dto/AttendanceDTO";
import { toAttendanceDTO } from "../mappers/attendance-dto.mapper";

export class ListAttendanceUseCase {
  constructor(private readonly repository: AttendanceRepository) {}

  public async execute(query: ListAttendanceQuery): Promise<readonly AttendanceDTO[]> {
    const list = await this.repository.list(query);
    return list.map((item) => toAttendanceDTO(item));
  }
}
