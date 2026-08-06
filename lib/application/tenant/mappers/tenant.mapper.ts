import { Tenant } from "@/lib/domain/tenant/entities/Tenant";
import { TenantDTO } from "../dto/TenantDTO";

export class TenantMapper {
  public static toDTO(tenant: Tenant, counts?: { employeeCount?: number; payrollCount?: number }): TenantDTO {
    return {
      id: tenant.id.getValue(),
      name: tenant.name,
      taxNumber: tenant.taxNumber,
      cnpsNumber: tenant.cnpsNumber,
      rccm: tenant.rccm,
      address: tenant.address,
      city: tenant.city,
      country: tenant.country,
      phone: tenant.phone,
      email: tenant.email,
      isMain: tenant.isMain,
      status: tenant.status.getValue(),
      createdAt: tenant.createdAt.toISOString(),
      updatedAt: tenant.updatedAt.toISOString(),
      employeeCount: counts?.employeeCount,
      payrollCount: counts?.payrollCount,
    };
  }
}
