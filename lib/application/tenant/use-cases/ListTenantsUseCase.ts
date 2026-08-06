import { TenantRepository, TenantListFilter } from "../ports/TenantRepository";
import { TenantMapper } from "../mappers/tenant.mapper";

export class ListTenantsUseCase {
  constructor(private tenantRepo: TenantRepository) {}

  public async execute(filter?: TenantListFilter) {
    const result = await this.tenantRepo.findAll(filter);
    return {
      tenants: result.tenants.map((t) => TenantMapper.toDTO(t)),
      total: result.total,
      activeCount: result.activeCount,
      inactiveCount: result.inactiveCount,
      suspendedCount: result.suspendedCount,
      page: result.page,
      limit: result.limit,
    };
  }
}
