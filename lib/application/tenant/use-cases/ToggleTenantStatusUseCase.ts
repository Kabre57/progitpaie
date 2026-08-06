import { TenantRepository } from "../ports/TenantRepository";
import { TenantMapper } from "../mappers/tenant.mapper";

export class ToggleTenantStatusUseCase {
  constructor(private tenantRepo: TenantRepository) {}

  public async execute(id: string, newStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED") {
    const tenant = await this.tenantRepo.findById(id);
    if (!tenant) {
      throw new Error(`Entreprise non trouvée: ${id}`);
    }

    if (newStatus === "ACTIVE") {
      tenant.activate();
    } else if (newStatus === "SUSPENDED") {
      tenant.suspend();
    } else if (newStatus === "INACTIVE") {
      tenant.deactivate();
    }

    await this.tenantRepo.save(tenant);
    return TenantMapper.toDTO(tenant);
  }
}
