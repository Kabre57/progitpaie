import { RoleEntity } from "@/lib/domain/auth/entities/Role";

export interface CreateRoleInput {
  name: string;
  description?: string;
  permissions: string[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissions?: string[];
}

export interface RoleRepository {
  findAllByCompany(companyId: string): Promise<RoleEntity[]>;
  findById(companyId: string, id: string): Promise<RoleEntity | null>;
  findByName(companyId: string, name: string): Promise<RoleEntity | null>;
  create(companyId: string, input: CreateRoleInput): Promise<RoleEntity>;
  update(companyId: string, id: string, input: UpdateRoleInput): Promise<RoleEntity>;
  delete(companyId: string, id: string): Promise<void>;
  assignRoleToUser(companyId: string, userId: string, roleId: string | null): Promise<void>;
}
