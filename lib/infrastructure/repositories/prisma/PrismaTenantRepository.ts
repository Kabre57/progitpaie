import { prisma } from "@/lib/db";
import { Tenant } from "@/lib/domain/tenant/entities/Tenant";
import { TenantId } from "@/lib/domain/tenant/value-objects/TenantId";
import { TenantStatus } from "@/lib/domain/tenant/value-objects/TenantStatus";
import {
  TenantRepository,
  TenantListFilter,
  TenantListResult,
  TenantAdminInfo,
} from "@/lib/application/tenant/ports/TenantRepository";
import { UserRole } from "@prisma/client";

export class PrismaTenantRepository implements TenantRepository {
  private mapToDomain(c: any): Tenant {
    const statusVal = c.isActive ? "ACTIVE" : "INACTIVE";
    return new Tenant({
      id: new TenantId(c.id),
      name: c.name,
      taxNumber: c.taxNumber ?? undefined,
      cnpsNumber: c.cnpsNumber ?? undefined,
      rccm: c.rccm ?? undefined,
      address: c.address ?? undefined,
      city: c.city ?? undefined,
      country: c.country ?? undefined,
      phone: c.phone ?? undefined,
      email: c.email ?? undefined,
      isMain: c.isMain,
      status: new TenantStatus(statusVal),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    });
  }

  public async findAll(filter?: TenantListFilter): Promise<TenantListResult> {
    const page = filter?.page || 1;
    const limit = filter?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filter?.search) {
      where.OR = [
        { name: { contains: filter.search, mode: "insensitive" } },
        { id: { contains: filter.search, mode: "insensitive" } },
        { taxNumber: { contains: filter.search, mode: "insensitive" } },
        { cnpsNumber: { contains: filter.search, mode: "insensitive" } },
      ];
    }

    if (filter?.status === "ACTIVE") {
      where.isActive = true;
    } else if (filter?.status === "INACTIVE" || filter?.status === "SUSPENDED") {
      where.isActive = false;
    }

    if (filter?.city) {
      where.city = { contains: filter.city, mode: "insensitive" };
    }

    const [records, total, activeCount, inactiveCount] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isMain: "desc" }, { createdAt: "desc" }],
      }),
      prisma.company.count({ where }),
      prisma.company.count({ where: { isActive: true } }),
      prisma.company.count({ where: { isActive: false } }),
    ]);

    return {
      tenants: records.map((r) => this.mapToDomain(r)),
      total,
      activeCount,
      inactiveCount,
      suspendedCount: 0,
      page,
      limit,
    };
  }

  public async findById(id: string): Promise<Tenant | null> {
    const record = await prisma.company.findUnique({
      where: { id },
    });
    if (!record) return null;
    return this.mapToDomain(record);
  }

  public async save(tenant: Tenant): Promise<void> {
    await prisma.company.update({
      where: { id: tenant.id.getValue() },
      data: {
        name: tenant.name,
        taxNumber: tenant.taxNumber,
        cnpsNumber: tenant.cnpsNumber,
        rccm: tenant.rccm,
        address: tenant.address,
        city: tenant.city,
        country: tenant.country,
        phone: tenant.phone,
        email: tenant.email,
        isActive: tenant.status.isActive(),
      },
    });
  }

  public async createWithAdmin(
    tenantData: Partial<Tenant>,
    adminData: { email: string; name: string; passwordHash: string }
  ): Promise<{ tenant: Tenant; adminId: string }> {
    const created = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: tenantData.name!,
          taxNumber: tenantData.taxNumber,
          cnpsNumber: tenantData.cnpsNumber,
          rccm: tenantData.rccm,
          address: tenantData.address,
          city: tenantData.city || "Abidjan",
          country: tenantData.country || "Côte d'Ivoire",
          phone: tenantData.phone,
          email: tenantData.email,
          isActive: true,
          isMain: false,
        },
      });

      const admin = await tx.user.create({
        data: {
          companyId: company.id,
          name: adminData.name,
          email: adminData.email,
          password: adminData.passwordHash,
          role: UserRole.admin,
        },
      });

      return { company, admin };
    });

    return {
      tenant: this.mapToDomain(created.company),
      adminId: created.admin.id,
    };
  }

  public async delete(id: string): Promise<void> {
    await prisma.$transaction([
      prisma.user.deleteMany({ where: { companyId: id } }),
      prisma.company.delete({ where: { id } }),
    ]);
  }

  public async getTenantAdmins(companyId: string): Promise<TenantAdminInfo[]> {
    const users = await prisma.user.findMany({
      where: { companyId, role: { in: [UserRole.admin, UserRole.super_admin] } },
      select: { id: true, email: true, name: true, role: true },
    });
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
    }));
  }

  public async getTenantStats(companyId: string) {
    const [employeeCount, payrollCount, activeLeavesCount, payrollAgg] = await Promise.all([
      prisma.user.count({ where: { companyId } }),
      prisma.payroll.count({ where: { companyId } }),
      prisma.leave.count({ where: { companyId, status: "approved" } }),
      prisma.payroll.aggregate({
        where: { companyId },
        _sum: { netSalary: true },
      }),
    ]);

    return {
      employeeCount,
      payrollCount,
      activeLeavesCount,
      totalPayrollAmount: Number(payrollAgg._sum?.netSalary || 0),
    };
  }
}
