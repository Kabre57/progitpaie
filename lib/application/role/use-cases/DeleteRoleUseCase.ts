import { RoleRepository } from "../ports/RoleRepository";

export class DeleteRoleUseCase {
  constructor(private readonly roleRepo: RoleRepository) {}

  public async execute(companyId: string, id: string): Promise<void> {
    if (!companyId) throw new Error("COMPANY_ID_REQUIRED");
    if (!id) throw new Error("ROLE_ID_REQUIRED");

    const existing = await this.roleRepo.findById(companyId, id);
    if (!existing) throw new Error("ROLE_NOT_FOUND");
    if (existing.isSystem) throw new Error("CANNOT_DELETE_SYSTEM_ROLE");
    if (existing.userCount && existing.userCount > 0) {
      throw new Error("CANNOT_DELETE_ROLE_WITH_ASSIGNED_USERS");
    }

    await this.roleRepo.delete(companyId, id);
  }
}
