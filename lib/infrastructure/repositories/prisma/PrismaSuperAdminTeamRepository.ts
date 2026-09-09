import { prisma } from "@/lib/db";
import { SuperAdminTeamRepository } from "@/lib/application/admin/ports/SuperAdminTeamRepository";
import { SuperAdminMemberDTO, CreateSuperAdminInput, UpdateSuperAdminInput } from "@/lib/application/admin/dto/SuperAdminTeamDTO";
import { UserRole } from "@prisma/client";

export class PrismaSuperAdminTeamRepository implements SuperAdminTeamRepository {
  async listSuperAdmins(): Promise<SuperAdminMemberDTO[]> {
    const users = await prisma.user.findMany({
      where: { role: UserRole.super_admin },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString(),
      lastLoginAt: null,
    }));
  }

  async findByEmail(email: string): Promise<SuperAdminMemberDTO | null> {
    const user = await prisma.user.findFirst({
      where: { email: email.trim().toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: null,
    };
  }

  async countSuperAdmins(): Promise<number> {
    return prisma.user.count({
      where: { role: UserRole.super_admin, isActive: true },
    });
  }

  async createSuperAdmin(input: CreateSuperAdminInput, hashedPassword: string): Promise<SuperAdminMemberDTO> {
    const mainCompany = await prisma.company.findFirst({
      where: { isMain: true },
      select: { id: true },
    }) || await prisma.company.findFirst({ select: { id: true } });

    if (!mainCompany) {
      throw new Error("Aucune entreprise disponible pour rattacher le Super Admin");
    }

    const created = await prisma.user.create({
      data: {
        companyId: mainCompany.id,
        name: input.name,
        email: input.email.trim().toLowerCase(),
        password: hashedPassword,
        role: UserRole.super_admin,
        mustChangePassword: false,
        isActive: true,
        leaveBalanceAnnual: 30,
        leaveBalanceSick: 15,
        leaveBalanceCasual: 10,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return {
      id: created.id,
      name: created.name,
      email: created.email,
      role: created.role,
      isActive: created.isActive,
      createdAt: created.createdAt.toISOString(),
      lastLoginAt: null,
    };
  }

  async updateSuperAdmin(input: UpdateSuperAdminInput, hashedPassword?: string): Promise<SuperAdminMemberDTO> {
    const updateData: {
      name?: string;
      isActive?: boolean;
      password?: string;
    } = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    if (hashedPassword) updateData.password = hashedPassword;

    const updated = await prisma.user.update({
      where: { id: input.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      isActive: updated.isActive,
      createdAt: updated.createdAt.toISOString(),
      lastLoginAt: null,
    };
  }

  async deleteSuperAdmin(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }
}
