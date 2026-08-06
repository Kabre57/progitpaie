import { TenantRepository } from "../ports/TenantRepository";
import { TenantMapper } from "../mappers/tenant.mapper";

export class GetTenantByIdUseCase {
  constructor(private tenantRepo: TenantRepository) {}

  public async execute(id: string) {
    const tenant = await this.tenantRepo.findById(id);
    if (!tenant) {
      throw new Error(`Entreprise non trouvée: ${id}`);
    }
    const admins = await this.tenantRepo.getTenantAdmins(id);
    const stats = await this.tenantRepo.getTenantStats(id);

    return {
      tenant: TenantMapper.toDTO(tenant, {
        employeeCount: stats.employeeCount,
        payrollCount: stats.payrollCount,
      }),
      admins,
      stats,
    };
  }
}
