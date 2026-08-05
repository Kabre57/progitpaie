import { OvertimeRequest } from "@/lib/domain/overtime/entities/OvertimeRequest";

export interface ListOvertimeQuery {
  companyId: string;
  userId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface OvertimeRepository {
  list(query: ListOvertimeQuery): Promise<readonly OvertimeRequest[]>;
  findByIdForTenant(companyId: string, id: string): Promise<OvertimeRequest | null>;
  save(overtime: OvertimeRequest): Promise<OvertimeRequest>;
}
