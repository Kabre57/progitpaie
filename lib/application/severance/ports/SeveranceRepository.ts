import { SeveranceCalculation } from "@/lib/domain/severance/entities/SeveranceCalculation";

export interface ListSeverancesQuery {
  companyId: string;
  userId?: string;
  terminationType?: string;
}

export interface SeveranceRepository {
  list(query: ListSeverancesQuery): Promise<readonly SeveranceCalculation[]>;
  findByIdForTenant(companyId: string, id: string): Promise<SeveranceCalculation | null>;
  save(severance: SeveranceCalculation): Promise<SeveranceCalculation>;
}
