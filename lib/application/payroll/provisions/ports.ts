import type { ProvisionEmployeeAggregate } from "@/lib/domain/payroll/provision/data";

export interface ProvisionDataQuery {
  readonly companyId: string;
  readonly referenceDate: Date;
}

export interface ProvisionRepository {
  loadProvisionData(query: ProvisionDataQuery): Promise<readonly ProvisionEmployeeAggregate[]>;
}
