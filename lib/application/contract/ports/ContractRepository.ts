import { WorkContract } from "@/lib/domain/contract/entities/WorkContract";

export interface ListContractsQuery {
  companyId: string;
  userId?: string;
  type?: string;
  status?: string;
}

export interface ContractRepository {
  list(query: ListContractsQuery): Promise<readonly WorkContract[]>;
  findByIdForTenant(companyId: string, id: string): Promise<WorkContract | null>;
  save(contract: WorkContract): Promise<WorkContract>;
}
