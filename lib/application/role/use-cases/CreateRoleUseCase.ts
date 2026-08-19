import { RoleRepository, CreateRoleInput } from "../ports/RoleRepository";
import { RoleEntity, RoleValidator } from "@/lib/domain/auth/entities/Role";

export class CreateRoleUseCase {
  constructor(private readonly roleRepo: RoleRepository) {}

  public async execute(companyId: string, input: CreateRoleInput): Promise<RoleEntity> {
    if (!companyId) throw new Error("COMPANY_ID_REQUIRED");
    if (!RoleValidator.validateRoleName(input.name)) {
      throw new Error("INVALID_ROLE_NAME");
    }

    const existing = await this.roleRepo.findByName(companyId, input.name.trim());
    if (existing) {
      throw new Error("ROLE_NAME_ALREADY_EXISTS");
    }

    const sanitizedPermissions = RoleValidator.sanitizePermissions(input.permissions);

    return this.roleRepo.create(companyId, {
      name: input.name.trim(),
      description: input.description?.trim(),
      permissions: sanitizedPermissions,
    });
  }
}
