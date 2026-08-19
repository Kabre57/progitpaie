import { PermissionRepository } from "../ports/PermissionRepository";

export class DeletePermissionModuleUseCase {
  constructor(private readonly permissionRepo: PermissionRepository) {}

  public async execute(companyId: string, moduleId: string): Promise<void> {
    if (!companyId) throw new Error("COMPANY_ID_REQUIRED");
    if (!moduleId) throw new Error("MODULE_ID_REQUIRED");

    const existing = await this.permissionRepo.findModuleById(companyId, moduleId);
    if (!existing) throw new Error("MODULE_NOT_FOUND");

    await this.permissionRepo.deleteModule(companyId, moduleId);
  }
}
