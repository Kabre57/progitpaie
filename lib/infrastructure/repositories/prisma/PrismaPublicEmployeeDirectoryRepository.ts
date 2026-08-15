import type {
  PublicEmployeeDirectoryQuery,
  PublicEmployeeDirectoryRepository,
  PublicEmployeeDirectoryResult,
} from "@/lib/application/employee/ports/PublicEmployeeDirectoryRepository";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export class PrismaPublicEmployeeDirectoryRepository implements PublicEmployeeDirectoryRepository {
  public async list(query: PublicEmployeeDirectoryQuery): Promise<PublicEmployeeDirectoryResult> {
    const where: Prisma.UserWhereInput = {
      companyId: query.companyId,
      isActive: true,
      ...(query.departmentId ? { departmentId: query.departmentId } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { email: { contains: query.search, mode: "insensitive" } },
              { employeeId: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const skip = (query.page - 1) * query.limit;
    const [employees, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: query.limit,
        select: {
          id: true,
          name: true,
          email: true,
          employeeId: true,
          jobTitle: true,
          contractType: true,
          isActive: true,
          department: { select: { id: true, name: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.user.count({ where }),
    ]);
    return { employees, total };
  }
}
