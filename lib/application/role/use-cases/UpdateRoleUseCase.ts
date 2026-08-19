import { RoleRepository, UpdateRoleInput } from "../ports/RoleRepository";
import { RoleEntity, RoleValidator } from "@/lib/domain/auth/entities/Role";

export class UpdateRoleUseCase {
  constructor(private readonly roleRepo: RoleRepository) {}

  public async execute(companyId: string, id: string, input: UpdateRoleInput): Promise<RoleEntity> {
    if (!companyId) throw new Error("COMPANY_ID_REQUIRED");
    if (!id) throw new Error("ROLE_ID_REQUIRED");

    const existing = await this.roleRepo.findById(companyId, id);
    if (!existing) throw new Error("ROLE_NOT_FOUND");

    if (input.name !== undefined) {
      if (!RoleValidator.validateRoleName(input.name)) {
        throw new Error("INVALID_ROLE_NAME");
      }
      const duplicate = await this.roleRepo.findByName(companyId, input.name.trim());
      if (duplicate && duplicate.id !== id) {
        throw new Error("ROLE_NAME_ALREADY_EXISTS");
      }
    }

    const permissions = input.permissions !== undefined
      ? RoleValidator.sanitizePermissions(input.permissions)
      : undefined;

    return this.roleRepo.update(companyId, id, {
      name: input.name?.trim(),
      description: input.description !== undefined ? input.description?.trim() : undefined,
      permissions,
    });
  }
}
