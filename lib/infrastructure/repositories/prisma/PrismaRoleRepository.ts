import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import {
  RoleRepository,
  CreateRoleInput,
  UpdateRoleInput,
} from "@/lib/application/role/ports/RoleRepository";
import { RoleEntity, RoleValidator } from "@/lib/domain/auth/entities/Role";

export class PrismaRoleRepository implements RoleRepository {
  public async findAllByCompany(companyId: string): Promise<RoleEntity[]> {
    const roles = await prisma.role.findMany({
      where: { companyId },
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return roles.map((r) => ({
      id: r.id,
      companyId: r.companyId,
      name: r.name,
      description: r.description,
      permissions: RoleValidator.sanitizePermissions(r.permissions),
      isSystem: r.isSystem,
      userCount: r._count.users,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  public async findById(companyId: string, id: string): Promise<RoleEntity | null> {
    const r = await prisma.role.findFirst({
      where: { id, companyId },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!r) return null;

    return {
      id: r.id,
      companyId: r.companyId,
      name: r.name,
      description: r.description,
      permissions: RoleValidator.sanitizePermissions(r.permissions),
      isSystem: r.isSystem,
      userCount: r._count.users,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  public async findByName(companyId: string, name: string): Promise<RoleEntity | null> {
    const r = await prisma.role.findFirst({
      where: {
        companyId,
        name: { equals: name, mode: "insensitive" },
      },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!r) return null;

    return {
      id: r.id,
      companyId: r.companyId,
      name: r.name,
      description: r.description,
      permissions: RoleValidator.sanitizePermissions(r.permissions),
      isSystem: r.isSystem,
      userCount: r._count.users,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  public async create(companyId: string, input: CreateRoleInput): Promise<RoleEntity> {
    const permissionsJson: Prisma.InputJsonValue = input.permissions;

    const created = await prisma.role.create({
      data: {
        companyId,
        name: input.name,
        description: input.description,
        permissions: permissionsJson,
      },
    });

    return {
      id: created.id,
      companyId: created.companyId,
      name: created.name,
      description: created.description,
      permissions: RoleValidator.sanitizePermissions(created.permissions),
      isSystem: created.isSystem,
      userCount: 0,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  public async update(companyId: string, id: string, input: UpdateRoleInput): Promise<RoleEntity> {
    const data: Prisma.RoleUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.permissions !== undefined) {
      data.permissions = input.permissions as Prisma.InputJsonValue;
    }

    const updated = await prisma.role.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    return {
      id: updated.id,
      companyId: updated.companyId,
      name: updated.name,
      description: updated.description,
      permissions: RoleValidator.sanitizePermissions(updated.permissions),
      isSystem: updated.isSystem,
      userCount: updated._count.users,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  public async delete(companyId: string, id: string): Promise<void> {
    await prisma.role.deleteMany({
      where: { id, companyId },
    });
  }

  public async assignRoleToUser(companyId: string, userId: string, roleId: string | null): Promise<void> {
    await prisma.user.updateMany({
      where: { id: userId, companyId },
      data: { roleId },
    });
  }
}
