import { PermissionRepository } from "../ports/PermissionRepository";
import { PermissionModuleEntity } from "@/lib/domain/auth/entities/PermissionCatalog";

export class SeedPermissionCatalogUseCase {
  constructor(private readonly permissionRepo: PermissionRepository) {}

  public async execute(companyId: string): Promise<PermissionModuleEntity[]> {
    if (!companyId) throw new Error("COMPANY_ID_REQUIRED");
    return this.permissionRepo.seedDefaultCatalog(companyId);
  }
}
