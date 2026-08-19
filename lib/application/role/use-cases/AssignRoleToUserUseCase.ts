import { RoleRepository } from "../ports/RoleRepository";

export class AssignRoleToUserUseCase {
  constructor(private readonly roleRepo: RoleRepository) {}

  public async execute(companyId: string, userId: string, roleId: string | null): Promise<void> {
    if (!companyId) throw new Error("COMPANY_ID_REQUIRED");
    if (!userId) throw new Error("USER_ID_REQUIRED");

    if (roleId) {
      const role = await this.roleRepo.findById(companyId, roleId);
      if (!role) throw new Error("ROLE_NOT_FOUND");
    }

    await this.roleRepo.assignRoleToUser(companyId, userId, roleId);
  }
}
