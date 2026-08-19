import { PermissionRepository, CreatePermissionDefinitionInput } from "../ports/PermissionRepository";
import { PermissionDefinitionEntity, PermissionCatalogValidator } from "@/lib/domain/auth/entities/PermissionCatalog";

export class CreatePermissionDefinitionUseCase {
  constructor(private readonly permissionRepo: PermissionRepository) {}

  public async execute(companyId: string, input: CreatePermissionDefinitionInput): Promise<PermissionDefinitionEntity> {
    if (!companyId) throw new Error("COMPANY_ID_REQUIRED");
    if (!input.moduleId) throw new Error("MODULE_ID_REQUIRED");
    if (!input.name || input.name.trim().length < 2) throw new Error("INVALID_PERMISSION_NAME");
    
    const module = await this.permissionRepo.findModuleById(companyId, input.moduleId);
    if (!module) throw new Error("MODULE_NOT_FOUND");

    const sanitizedCode = PermissionCatalogValidator.sanitizeCode(input.code || `${module.code}.${input.name}`);
    if (!PermissionCatalogValidator.validateCode(sanitizedCode)) {
      throw new Error("INVALID_PERMISSION_CODE");
    }

    const existing = await this.permissionRepo.findPermissionByCode(companyId, sanitizedCode);
    if (existing) throw new Error("PERMISSION_CODE_ALREADY_EXISTS");

    return this.permissionRepo.createPermission(companyId, {
      moduleId: input.moduleId,
      name: input.name.trim(),
      code: sanitizedCode,
      action: input.action?.trim() || "read",
      description: input.description?.trim(),
    });
  }
}
