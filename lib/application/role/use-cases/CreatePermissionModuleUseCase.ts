import { PermissionRepository, CreatePermissionModuleInput } from "../ports/PermissionRepository";
import { PermissionModuleEntity, PermissionCatalogValidator } from "@/lib/domain/auth/entities/PermissionCatalog";

export class CreatePermissionModuleUseCase {
  constructor(private readonly permissionRepo: PermissionRepository) {}

  public async execute(companyId: string, input: CreatePermissionModuleInput): Promise<PermissionModuleEntity> {
    if (!companyId) throw new Error("COMPANY_ID_REQUIRED");
    if (!input.name || input.name.trim().length < 2) throw new Error("INVALID_MODULE_NAME");
    
    const sanitizedCode = PermissionCatalogValidator.sanitizeCode(input.code || input.name);
    if (!PermissionCatalogValidator.validateCode(sanitizedCode)) {
      throw new Error("INVALID_MODULE_CODE");
    }

    const existing = await this.permissionRepo.findModuleByCode(companyId, sanitizedCode);
    if (existing) throw new Error("MODULE_CODE_ALREADY_EXISTS");

    return this.permissionRepo.createModule(companyId, {
      name: input.name.trim(),
      code: sanitizedCode,
      description: input.description?.trim(),
      icon: input.icon || "Shield",
    });
  }
}
