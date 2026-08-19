import { RoleValidator } from "../entities/Role";
import { PermissionCatalogValidator } from "../entities/PermissionCatalog";
import { DEFAULT_PERMISSION_CATALOG } from "../default-permissions";

describe("Domain — Rôles & Permissions", () => {
  describe("RoleValidator", () => {
    it("valide les noms de rôles conformes", () => {
      expect(RoleValidator.validateRoleName("Admin RH")).toBe(true);
      expect(RoleValidator.validateRoleName("Gestionnaire Paie Junior")).toBe(true);
      expect(RoleValidator.validateRoleName("A")).toBe(false);
      expect(RoleValidator.validateRoleName("")).toBe(false);
    });

    it("nettoie et filtre les permissions fournies", () => {
      expect(RoleValidator.sanitizePermissions(["employees.read", "  payroll.close  ", "", null, 123])).toEqual([
        "employees.read",
        "payroll.close",
      ]);
      expect(RoleValidator.sanitizePermissions(null)).toEqual([]);
      expect(RoleValidator.sanitizePermissions(undefined)).toEqual([]);
    });
  });

  describe("PermissionCatalogValidator", () => {
    it("valide les codes de permissions et modules", () => {
      expect(PermissionCatalogValidator.validateCode("employees.read")).toBe(true);
      expect(PermissionCatalogValidator.validateCode("payroll.calculate_gross")).toBe(true);
      expect(PermissionCatalogValidator.validateCode("custom-mod.action-1")).toBe(true);
      expect(PermissionCatalogValidator.validateCode("Invalid Code With Spaces")).toBe(false);
      expect(PermissionCatalogValidator.validateCode("")).toBe(false);
    });

    it("assainit les codes saisis", () => {
      expect(PermissionCatalogValidator.sanitizeCode("Gestion Flotte")).toBe("gestion_flotte");
      expect(PermissionCatalogValidator.sanitizeCode("  PAYROLL.Approve  ")).toBe("payroll.approve");
    });
  });

  describe("DEFAULT_PERMISSION_CATALOG", () => {
    it("contient l'ensemble des modules obligatoires du système", () => {
      const moduleCodes = DEFAULT_PERMISSION_CATALOG.map((m) => m.code);
      expect(moduleCodes).toContain("employees");
      expect(moduleCodes).toContain("attendance");
      expect(moduleCodes).toContain("leaves");
      expect(moduleCodes).toContain("payroll");
      expect(moduleCodes).toContain("contracts");
      expect(moduleCodes).toContain("settings");
    });

    it("chaque permission du catalogue a un code valide et une action", () => {
      DEFAULT_PERMISSION_CATALOG.forEach((mod) => {
        expect(PermissionCatalogValidator.validateCode(mod.code)).toBe(true);
        mod.permissions.forEach((p) => {
          expect(PermissionCatalogValidator.validateCode(p.code)).toBe(true);
          expect(["read", "create", "update", "delete", "approve", "export", "custom"]).toContain(p.action);
        });
      });
    });
  });
});
