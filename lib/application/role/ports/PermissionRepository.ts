import {
  PermissionModuleEntity,
  PermissionDefinitionEntity,
} from "@/lib/domain/auth/entities/PermissionCatalog";

export interface CreatePermissionModuleInput {
  name: string;
  code: string;
  description?: string;
  icon?: string;
}

export interface CreatePermissionDefinitionInput {
  moduleId: string;
  name: string;
  code: string;
  action: string;
  description?: string;
}

export interface PermissionRepository {
  findCatalog(companyId: string): Promise<PermissionModuleEntity[]>;
  findModuleByCode(companyId: string, code: string): Promise<PermissionModuleEntity | null>;
  findModuleById(companyId: string, id: string): Promise<PermissionModuleEntity | null>;
  createModule(companyId: string, input: CreatePermissionModuleInput): Promise<PermissionModuleEntity>;
  deleteModule(companyId: string, id: string): Promise<void>;
  
  findPermissionByCode(companyId: string, code: string): Promise<PermissionDefinitionEntity | null>;
  createPermission(companyId: string, input: CreatePermissionDefinitionInput): Promise<PermissionDefinitionEntity>;
  deletePermission(companyId: string, id: string): Promise<void>;
  
  seedDefaultCatalog(companyId: string): Promise<PermissionModuleEntity[]>;
  clearCatalog(companyId: string): Promise<void>;
}
