export interface AuditLogEntryDTO {
  id: string;
  action: string;
  targetModel: string;
  targetId?: string;
  companyId: string;
  companyName: string;
  performedById: string;
  performedByName: string;
  performedByEmail: string;
  ipAddress?: string;
  userAgent?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  timestamp: string;
}

export interface AuditLogListFilter {
  search?: string;         // free-text search on action or performedByName
  action?: string;         // exact action match
  targetModel?: string;    // e.g. "User", "Payroll", "Leave"
  companyId?: string;      // filter by company
  performedById?: string;  // filter by who did it
  fromDate?: string;       // ISO date string
  toDate?: string;         // ISO date string
  page?: number;
  limit?: number;
}

export interface AuditLogListResultDTO {
  logs: AuditLogEntryDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Distinct values used to populate filter dropdowns */
export interface AuditLogFiltersMetaDTO {
  actions: string[];
  targetModels: string[];
  companies: Array<{ id: string; name: string }>;
}
