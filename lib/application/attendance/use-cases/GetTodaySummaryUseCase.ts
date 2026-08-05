import { AttendanceRepository, TodaySummaryDTO } from "../ports/AttendanceRepository";

export class GetTodaySummaryUseCase {
  constructor(private readonly repository: AttendanceRepository) {}

  public async execute(companyId: string, dateStr?: string): Promise<TodaySummaryDTO> {
    const targetDate = dateStr || new Date().toISOString().split("T")[0];
    return this.repository.getTodaySummary(companyId, targetDate);
  }
}
