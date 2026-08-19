import type { AuthIdentity, AuthIdentityRepository, AuthPasswordRecord, AuthSessionProfile } from "@/lib/application/auth/ports/AuthIdentityRepository";
import { prisma } from "@/lib/db";

export class PrismaAuthIdentityRepository implements AuthIdentityRepository {
  public async findByEmail(email: string): Promise<AuthIdentity | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
        isActive: true,
        mustChangePassword: true,
        companyId: true,
      },
    });
    return user
      ? {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          passwordHash: user.password,
          isActive: user.isActive,
          mustChangePassword: user.mustChangePassword ?? false,
          companyId: user.companyId,
        }
      : null;
  }

  public async findPasswordById(id: string): Promise<AuthPasswordRecord | null> {
    const user = await prisma.user.findUnique({ where: { id }, select: { id: true, password: true } });
    return user ? { id: user.id, passwordHash: user.password } : null;
  }

  public async updatePassword(id: string, passwordHash: string): Promise<void> {
    await prisma.user.update({ where: { id }, data: { password: passwordHash, mustChangePassword: false } });
  }

  public async saveResetTokenForActiveUser(email: string, token: string, expiresAt: Date): Promise<boolean> {
    const result = await prisma.user.updateMany({
      where: { email: email.toLowerCase(), isActive: true },
      data: { resetPasswordToken: token, resetPasswordExpires: expiresAt },
    });
    return result.count > 0;
  }

  public async resetPasswordFromValidToken(token: string, passwordHash: string, now: Date): Promise<boolean> {
    const result = await prisma.user.updateMany({
      where: { resetPasswordToken: token, resetPasswordExpires: { gt: now } },
      data: {
        password: passwordHash,
        mustChangePassword: false,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });
    return result.count === 1;
  }

  public async findSessionProfileById(id: string): Promise<AuthSessionProfile | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        employeeId: true,
        departmentId: true,
        department: { select: { name: true } },
        leaveBalanceAnnual: true,
        leaveBalanceSick: true,
        leaveBalanceCasual: true,
        salary: true,
        sursalaire: true,
        joiningDate: true,
        createdAt: true,
        roleId: true,
        customRole: {
          select: {
            name: true,
            permissions: true,
          },
        },
      },
    });
    if (!user) return null;

    let effectivePermissions: string[] = [];
    if (user.role === "super_admin") {
      effectivePermissions = ["*"];
    } else if (user.customRole?.permissions && Array.isArray(user.customRole.permissions)) {
      effectivePermissions = user.customRole.permissions as string[];
    } else if (user.role === "admin") {
      effectivePermissions = ["*"];
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      departmentId: user.departmentId,
      departmentName: user.department?.name ?? null,
      leaveBalanceAnnual: user.leaveBalanceAnnual,
      leaveBalanceSick: user.leaveBalanceSick,
      leaveBalanceCasual: user.leaveBalanceCasual,
      salary: user.salary,
      sursalaire: user.sursalaire,
      joiningDate: user.joiningDate,
      createdAt: user.createdAt,
      roleId: user.roleId ?? null,
      roleName: user.customRole?.name ?? null,
      permissions: effectivePermissions,
    };
  }
}
