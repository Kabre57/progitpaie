import { prisma } from "@/lib/db";
import {
  PermissionRepository,
  CreatePermissionModuleInput,
  CreatePermissionDefinitionInput,
} from "@/lib/application/role/ports/PermissionRepository";
import {
  PermissionModuleEntity,
  PermissionDefinitionEntity,
} from "@/lib/domain/auth/entities/PermissionCatalog";
import { DEFAULT_PERMISSION_CATALOG } from "@/lib/domain/auth/default-permissions";

export class PrismaPermissionRepository implements PermissionRepository {
  public async findCatalog(companyId: string): Promise<PermissionModuleEntity[]> {
    const records = await prisma.permissionModule.findMany({
      where: { companyId },
      include: {
        permissions: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return records.map((mod) => ({
      id: mod.id,
      companyId: mod.companyId,
      name: mod.name,
      code: mod.code,
      description: mod.description,
      icon: mod.icon,
      createdAt: mod.createdAt,
      updatedAt: mod.updatedAt,
      permissions: mod.permissions.map((p) => ({
        id: p.id,
        moduleId: p.moduleId,
        companyId: p.companyId,
        name: p.name,
        code: p.code,
        action: p.action,
        description: p.description,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    }));
  }

  public async findModuleByCode(companyId: string, code: string): Promise<PermissionModuleEntity | null> {
    const mod = await prisma.permissionModule.findUnique({
      where: {
        companyId_code: { companyId, code },
      },
      include: {
        permissions: true,
      },
    });

    if (!mod) return null;

    return {
      id: mod.id,
      companyId: mod.companyId,
      name: mod.name,
      code: mod.code,
      description: mod.description,
      icon: mod.icon,
      createdAt: mod.createdAt,
      updatedAt: mod.updatedAt,
      permissions: mod.permissions,
    };
  }

  public async findModuleById(companyId: string, id: string): Promise<PermissionModuleEntity | null> {
    const mod = await prisma.permissionModule.findFirst({
      where: { id, companyId },
      include: { permissions: true },
    });

    if (!mod) return null;

    return {
      id: mod.id,
      companyId: mod.companyId,
      name: mod.name,
      code: mod.code,
      description: mod.description,
      icon: mod.icon,
      createdAt: mod.createdAt,
      updatedAt: mod.updatedAt,
      permissions: mod.permissions,
    };
  }

  public async createModule(companyId: string, input: CreatePermissionModuleInput): Promise<PermissionModuleEntity> {
    const created = await prisma.permissionModule.create({
      data: {
        companyId,
        name: input.name,
        code: input.code,
        description: input.description,
        icon: input.icon || "Shield",
      },
      include: {
        permissions: true,
      },
    });

    return {
      id: created.id,
      companyId: created.companyId,
      name: created.name,
      code: created.code,
      description: created.description,
      icon: created.icon,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
      permissions: [],
    };
  }

  public async deleteModule(companyId: string, id: string): Promise<void> {
    await prisma.permissionModule.deleteMany({
      where: { id, companyId },
    });
  }

  public async findPermissionByCode(companyId: string, code: string): Promise<PermissionDefinitionEntity | null> {
    const p = await prisma.permissionDefinition.findUnique({
      where: {
        companyId_code: { companyId, code },
      },
    });

    if (!p) return null;

    return {
      id: p.id,
      moduleId: p.moduleId,
      companyId: p.companyId,
      name: p.name,
      code: p.code,
      action: p.action,
      description: p.description,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  public async createPermission(
    companyId: string,
    input: CreatePermissionDefinitionInput
  ): Promise<PermissionDefinitionEntity> {
    const created = await prisma.permissionDefinition.create({
      data: {
        companyId,
        moduleId: input.moduleId,
        name: input.name,
        code: input.code,
        action: input.action,
        description: input.description,
      },
    });

    return {
      id: created.id,
      moduleId: created.moduleId,
      companyId: created.companyId,
      name: created.name,
      code: created.code,
      action: created.action,
      description: created.description,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  public async deletePermission(companyId: string, id: string): Promise<void> {
    await prisma.permissionDefinition.deleteMany({
      where: { id, companyId },
    });
  }

  public async seedDefaultCatalog(companyId: string): Promise<PermissionModuleEntity[]> {
    for (const mod of DEFAULT_PERMISSION_CATALOG) {
      const createdModule = await prisma.permissionModule.upsert({
        where: {
          companyId_code: { companyId, code: mod.code },
        },
        update: {
          name: mod.name,
          description: mod.description,
          icon: mod.icon,
        },
        create: {
          companyId,
          name: mod.name,
          code: mod.code,
          description: mod.description,
          icon: mod.icon,
        },
      });

      for (const perm of mod.permissions) {
        await prisma.permissionDefinition.upsert({
          where: {
            companyId_code: { companyId, code: perm.code },
          },
          update: {
            name: perm.name,
            action: perm.action,
            description: perm.description,
          },
          create: {
            companyId,
            moduleId: createdModule.id,
            name: perm.name,
            code: perm.code,
            action: perm.action,
            description: perm.description,
          },
        });
      }
    }

    return this.findCatalog(companyId);
  }

  public async clearCatalog(companyId: string): Promise<void> {
    await prisma.permissionDefinition.deleteMany({
      where: { companyId },
    });
    await prisma.permissionModule.deleteMany({
      where: { companyId },
    });
  }
}
