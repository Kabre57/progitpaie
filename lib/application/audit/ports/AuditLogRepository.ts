export interface AuditLogEntryInput {
  companyId: string;
  performedById: string;
  action: string;
  targetModel: string;
  targetId: string;
  oldValues: unknown;
  newValues: unknown;
  timestamp: Date;
}

export interface AuditLogRepository {
  create(entry: AuditLogEntryInput): Promise<void>;
}
