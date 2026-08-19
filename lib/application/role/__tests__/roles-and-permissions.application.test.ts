import { PermissionRepository } from "../ports/PermissionRepository";
import { RoleRepository } from "../ports/RoleRepository";
import { GetPermissionCatalogUseCase } from "../use-cases/GetPermissionCatalogUseCase";
import { CreatePermissionModuleUseCase } from "../use-cases/CreatePermissionModuleUseCase";
import { CreatePermissionDefinitionUseCase } from "../use-cases/CreatePermissionDefinitionUseCase";
import { CreateRoleUseCase } from "../use-cases/CreateRoleUseCase";
import { UpdateRoleUseCase } from "../use-cases/UpdateRoleUseCase";
import { DeleteRoleUseCase } from "../use-cases/DeleteRoleUseCase";
import { AssignRoleToUserUseCase } from "../use-cases/AssignRoleToUserUseCase";
import { PermissionModuleEntity } from "@/lib/domain/auth/entities/PermissionCatalog";
import { RoleEntity } from "@/lib/domain/auth/entities/Role";

describe("Application — Use Cases Rôles & Permissions", () => {
  const companyId = "company-tenant-123";

  // Mock Permission Repository
  const mockPermissionRepo: jest.Mocked<PermissionRepository> = {
    findCatalog: jest.fn(),
    findModuleByCode: jest.fn(),
    findModuleById: jest.fn(),
    createModule: jest.fn(),
    deleteModule: jest.fn(),
    findPermissionByCode: jest.fn(),
    createPermission: jest.fn(),
    deletePermission: jest.fn(),
    seedDefaultCatalog: jest.fn(),
    clearCatalog: jest.fn(),
  };

  // Mock Role Repository
  const mockRoleRepo: jest.Mocked<RoleRepository> = {
    findAllByCompany: jest.fn(),
    findById: jest.fn(),
    findByName: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    assignRoleToUser: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GetPermissionCatalogUseCase", () => {
    it("retourne le catalogue de l'entreprise", async () => {
      const existingCatalog: PermissionModuleEntity[] = [
        { id: "mod-1", companyId, name: "RH", code: "rh", permissions: [] },
      ];
      mockPermissionRepo.findCatalog.mockResolvedValue(existingCatalog);

      const useCase = new GetPermissionCatalogUseCase(mockPermissionRepo);
      const result = await useCase.execute(companyId);

      expect(result).toEqual(existingCatalog);
      expect(mockPermissionRepo.findCatalog).toHaveBeenCalledWith(companyId);
    });
  });

  describe("ClearPermissionCatalogUseCase & SeedPermissionCatalogUseCase", () => {
    it("vide intégralement le catalogue", async () => {
      const { ClearPermissionCatalogUseCase } = await import("../use-cases/ClearPermissionCatalogUseCase");
      mockPermissionRepo.clearCatalog.mockResolvedValue();

      const useCase = new ClearPermissionCatalogUseCase(mockPermissionRepo);
      await useCase.execute(companyId);

      expect(mockPermissionRepo.clearCatalog).toHaveBeenCalledWith(companyId);
    });

    it("importe le catalogue standard", async () => {
      const { SeedPermissionCatalogUseCase } = await import("../use-cases/SeedPermissionCatalogUseCase");
      const seeded: PermissionModuleEntity[] = [
        { id: "mod-1", companyId, name: "Paie", code: "payroll", permissions: [] },
      ];
      mockPermissionRepo.seedDefaultCatalog.mockResolvedValue(seeded);

      const useCase = new SeedPermissionCatalogUseCase(mockPermissionRepo);
      const result = await useCase.execute(companyId);

      expect(mockPermissionRepo.seedDefaultCatalog).toHaveBeenCalledWith(companyId);
      expect(result).toEqual(seeded);
    });
  });

  describe("CreatePermissionModuleUseCase", () => {
    it("crée un module avec code nettoyé", async () => {
      mockPermissionRepo.findModuleByCode.mockResolvedValue(null);
      mockPermissionRepo.createModule.mockResolvedValue({
        id: "mod-created",
        companyId,
        name: "Flotte Auto",
        code: "flotte_auto",
        permissions: [],
      });

      const useCase = new CreatePermissionModuleUseCase(mockPermissionRepo);
      const result = await useCase.execute(companyId, {
        name: "Flotte Auto",
        code: "Flotte Auto",
      });

      expect(mockPermissionRepo.createModule).toHaveBeenCalledWith(companyId, {
        name: "Flotte Auto",
        code: "flotte_auto",
        description: undefined,
        icon: "Shield",
      });
      expect(result.code).toBe("flotte_auto");
    });

    it("rejette si le code de module existe déjà pour le tenant", async () => {
      mockPermissionRepo.findModuleByCode.mockResolvedValue({
        id: "mod-existing",
        companyId,
        name: "RH",
        code: "rh",
      });

      const useCase = new CreatePermissionModuleUseCase(mockPermissionRepo);
      await expect(useCase.execute(companyId, { name: "RH", code: "rh" })).rejects.toThrow(
        "MODULE_CODE_ALREADY_EXISTS"
      );
    });
  });

  describe("CreatePermissionDefinitionUseCase", () => {
    it("crée une permission rattachée à un module valide", async () => {
      mockPermissionRepo.findModuleById.mockResolvedValue({
        id: "mod-1",
        companyId,
        name: "Paie",
        code: "payroll",
      });
      mockPermissionRepo.findPermissionByCode.mockResolvedValue(null);
      mockPermissionRepo.createPermission.mockResolvedValue({
        id: "perm-1",
        moduleId: "mod-1",
        companyId,
        name: "Valider Prime",
        code: "payroll.approve_bonus",
        action: "approve",
      });

      const useCase = new CreatePermissionDefinitionUseCase(mockPermissionRepo);
      const result = await useCase.execute(companyId, {
        moduleId: "mod-1",
        name: "Valider Prime",
        code: "payroll.approve_bonus",
        action: "approve",
      });

      expect(result.code).toBe("payroll.approve_bonus");
    });
  });

  describe("CreateRoleUseCase", () => {
    it("crée un rôle avec sa matrice de permissions", async () => {
      mockRoleRepo.findByName.mockResolvedValue(null);
      mockRoleRepo.create.mockResolvedValue({
        id: "role-1",
        companyId,
        name: "Comptable Junior",
        permissions: ["payroll.read", "accounting.read"],
        userCount: 0,
      });

      const useCase = new CreateRoleUseCase(mockRoleRepo);
      const result = await useCase.execute(companyId, {
        name: "Comptable Junior",
        permissions: ["payroll.read", "accounting.read"],
      });

      expect(result.name).toBe("Comptable Junior");
      expect(result.permissions).toEqual(["payroll.read", "accounting.read"]);
    });

    it("rejette la création si un rôle du même nom existe pour ce tenant", async () => {
      mockRoleRepo.findByName.mockResolvedValue({
        id: "role-existing",
        companyId,
        name: "Comptable",
        permissions: [],
      });

      const useCase = new CreateRoleUseCase(mockRoleRepo);
      await expect(
        useCase.execute(companyId, { name: "Comptable", permissions: [] })
      ).rejects.toThrow("ROLE_NAME_ALREADY_EXISTS");
    });
  });

  describe("DeleteRoleUseCase", () => {
    it("bloque la suppression d'un rôle système", async () => {
      mockRoleRepo.findById.mockResolvedValue({
        id: "role-sys",
        companyId,
        name: "Admin",
        permissions: ["*"],
        isSystem: true,
      });

      const useCase = new DeleteRoleUseCase(mockRoleRepo);
      await expect(useCase.execute(companyId, "role-sys")).rejects.toThrow(
        "CANNOT_DELETE_SYSTEM_ROLE"
      );
    });

    it("bloque la suppression si des utilisateurs y sont rattachés", async () => {
      mockRoleRepo.findById.mockResolvedValue({
        id: "role-in-use",
        companyId,
        name: "Superviseur",
        permissions: ["attendance.read"],
        isSystem: false,
        userCount: 3,
      });

      const useCase = new DeleteRoleUseCase(mockRoleRepo);
      await expect(useCase.execute(companyId, "role-in-use")).rejects.toThrow(
        "CANNOT_DELETE_ROLE_WITH_ASSIGNED_USERS"
      );
    });

    it("supprime un rôle valide sans utilisateurs assignés", async () => {
      mockRoleRepo.findById.mockResolvedValue({
        id: "role-free",
        companyId,
        name: "Stagiaire RH",
        permissions: ["employees.read"],
        isSystem: false,
        userCount: 0,
      });
      mockRoleRepo.delete.mockResolvedValue();

      const useCase = new DeleteRoleUseCase(mockRoleRepo);
      await useCase.execute(companyId, "role-free");
      expect(mockRoleRepo.delete).toHaveBeenCalledWith(companyId, "role-free");
    });
  });

  describe("AssignRoleToUserUseCase", () => {
    it("assigne un rôle existant à l'utilisateur", async () => {
      mockRoleRepo.findById.mockResolvedValue({
        id: "role-target",
        companyId,
        name: "Gestionnaire",
        permissions: [],
      });
      mockRoleRepo.assignRoleToUser.mockResolvedValue();

      const useCase = new AssignRoleToUserUseCase(mockRoleRepo);
      await useCase.execute(companyId, "user-42", "role-target");

      expect(mockRoleRepo.assignRoleToUser).toHaveBeenCalledWith(
        companyId,
        "user-42",
        "role-target"
      );
    });
  });
});
