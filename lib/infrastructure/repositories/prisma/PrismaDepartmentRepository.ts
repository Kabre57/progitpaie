import type {
  CreateDepartmentInput,
  DepartmentRecord,
  DepartmentRepository,
  UpdateDepartmentInput,
} from "@/lib/application/hr/ports/DepartmentRepository";
import { prisma } from "@/lib/db";

function toRecord(department: {
  id: string;
  companyId: string;
  name: string;
  description: string;
  managerId: string | null;
  manager: { id: string; name: string | null; email: string | null } | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): DepartmentRecord {
  return department;
}

export class PrismaDepartmentRepository implements DepartmentRepository {
  public async list(companyId: string, includeInactive: boolean): Promise<readonly DepartmentRecord[]> {
    const departments = await prisma.department.findMany({
      where: { companyId, ...(includeInactive ? {} : { isActive: true }) },
      include: { manager: { select: { id: true, name: true, email: true } } },
      orderBy: { name: "asc" },
    });
    return departments.map(toRecord);
  }

  public async findById(companyId: string, id: string): Promise<DepartmentRecord | null> {
    const department = await prisma.department.findFirst({
      where: { id, companyId },
      include: { manager: { select: { id: true, name: true, email: true } } },
    });
    return department ? toRecord(department) : null;
  }

  public async findByName(companyId: string, name: string, excludeId?: string): Promise<DepartmentRecord | null> {
    const department = await prisma.department.findFirst({
      where: {
        companyId,
        name: { equals: name, mode: "insensitive" },
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      include: { manager: { select: { id: true, name: true, email: true } } },
    });
    return department ? toRecord(department) : null;
  }

  public async create(input: CreateDepartmentInput): Promise<DepartmentRecord> {
    const department = await prisma.department.create({
      data: {
        companyId: input.companyId,
        name: input.name,
        description: input.description,
        managerId: input.managerId,
        isActive: true,
      },
      include: { manager: { select: { id: true, name: true, email: true } } },
    });
    return toRecord(department);
  }

  public async update(input: UpdateDepartmentInput): Promise<DepartmentRecord> {
    const department = await prisma.department.update({
      where: { id: input.id, companyId: input.companyId },
      data: {
        name: input.name,
        description: input.description,
        managerId: input.managerId,
      },
      include: { manager: { select: { id: true, name: true, email: true } } },
    });
    return toRecord(department);
  }

  public async deactivate(companyId: string, id: string): Promise<void> {
    await prisma.department.update({
      where: { id, companyId },
      data: { isActive: false },
    });
  }
}
