export interface PermissionDefinitionEntity {
  id?: string;
  moduleId: string;
  companyId: string;
  name: string;
  code: string;
  action: string;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PermissionModuleEntity {
  id?: string;
  companyId: string;
  name: string;
  code: string;
  description?: string | null;
  icon?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  permissions?: PermissionDefinitionEntity[];
}

export class PermissionCatalogValidator {
  public static validateCode(code: string): boolean {
    if (!code || typeof code !== "string") return false;
    const trimmed = code.trim();
    // Codes must be lowercase alphanumeric with dots/underscores/hyphens, e.g. "employees.read", "payroll.calculate"
    return /^[a-z0-9_-]+(\.[a-z0-9_-]+)*$/.test(trimmed);
  }

  public static sanitizeCode(code: string): string {
    return code.trim().toLowerCase().replace(/\s+/g, "_");
  }
}
