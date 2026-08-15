import type {
  CreateDemoAccountInput,
  DemoAccount,
  DemoSignupRepository,
  ExistingAuthUser,
} from "@/lib/application/auth/ports/DemoSignupRepository";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

function toExistingUser(user: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string | null;
  isActive: boolean;
}): ExistingAuthUser {
  return { ...user, role: user.role };
}

export class PrismaDemoSignupRepository implements DemoSignupRepository {
  public async findUserByEmail(email: string): Promise<ExistingAuthUser | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, name: true, email: true, role: true, companyId: true, isActive: true },
    });
    return user ? toExistingUser(user) : null;
  }

  public async createDemoAccount(input: CreateDemoAccountInput): Promise<DemoAccount> {
    return prisma.$transaction(async (transaction) => {
      const company = await transaction.company.create({
        data: {
          name: input.companyName,
          email: input.email,
          city: "Abidjan",
          country: "Côte d’Ivoire",
          isMain: false,
          isActive: true,
          isDemo: true,
          demoExpiresAt: input.expiresAt,
          plan: "FREE_TRIAL",
          subscriptionStatus: "TRIALING",
          subscriptionExpiresAt: input.expiresAt,
          verificationStatus: "INCOMPLETE",
        },
        select: { id: true, demoExpiresAt: true },
      });
      const department = input.departmentName
        ? await transaction.department.create({ data: { name: input.departmentName, companyId: company.id }, select: { id: true } })
        : null;
      const user = await transaction.user.create({
        data: {
          companyId: company.id,
          name: input.name,
          email: input.email,
          password: input.passwordHash,
          role: UserRole.admin,
          employeeId: null,
          departmentId: department?.id ?? null,
          leaveBalanceAnnual: 20,
          leaveBalanceSick: 10,
          leaveBalanceCasual: 5,
        },
        select: { id: true, name: true, email: true, role: true, companyId: true, isActive: true },
      });
      return { user: toExistingUser(user), demoExpiresAt: company.demoExpiresAt ?? input.expiresAt };
    });
  }
}
