export interface RoleEntity {
  id?: string;
  companyId: string;
  name: string;
  description?: string | null;
  permissions: string[];
  isSystem?: boolean;
  userCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class RoleValidator {
  public static validateRoleName(name: string): boolean {
    if (!name || typeof name !== "string") return false;
    return name.trim().length >= 2 && name.trim().length <= 100;
  }

  public static sanitizePermissions(permissions: unknown): string[] {
    if (!Array.isArray(permissions)) return [];
    return permissions
      .filter((p): p is string => typeof p === "string" && p.trim().length > 0)
      .map((p) => p.trim());
  }
}
