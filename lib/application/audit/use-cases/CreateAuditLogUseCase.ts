import type { AuditLogEntryInput, AuditLogRepository } from "../ports/AuditLogRepository";

export class CreateAuditLogUseCase {
  public constructor(private readonly repository: AuditLogRepository) {}

  public execute(entry: AuditLogEntryInput): Promise<void> {
    return this.repository.create(entry);
  }
}
