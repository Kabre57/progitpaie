import { RoleRepository } from "../ports/RoleRepository";
import { RoleEntity } from "@/lib/domain/auth/entities/Role";

export class ListRolesUseCase {
  constructor(private readonly roleRepo: RoleRepository) {}

  public async execute(companyId: string): Promise<RoleEntity[]> {
    if (!companyId) throw new Error("COMPANY_ID_REQUIRED");
    return this.roleRepo.findAllByCompany(companyId);
  }
}
