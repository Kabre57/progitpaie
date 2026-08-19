import { PermissionRepository } from "../ports/PermissionRepository";

export class ClearPermissionCatalogUseCase {
  constructor(private readonly permissionRepo: PermissionRepository) {}

  public async execute(companyId: string): Promise<void> {
    if (!companyId) throw new Error("COMPANY_ID_REQUIRED");
    await this.permissionRepo.clearCatalog(companyId);
  }
}
