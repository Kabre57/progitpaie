import { PermissionRepository } from "../ports/PermissionRepository";

export class DeletePermissionDefinitionUseCase {
  constructor(private readonly permissionRepo: PermissionRepository) {}

  public async execute(companyId: string, permissionId: string): Promise<void> {
    if (!companyId) throw new Error("COMPANY_ID_REQUIRED");
    if (!permissionId) throw new Error("PERMISSION_ID_REQUIRED");

    await this.permissionRepo.deletePermission(companyId, permissionId);
  }
}
