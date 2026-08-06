import { Tenant } from "@/lib/domain/tenant/entities/Tenant";

export interface TenantListFilter {
  search?: string;
  status?: string;
  city?: string;
  page?: number;
  limit?: number;
}

export interface TenantListResult {
  tenants: Tenant[];
  total: number;
  activeCount: number;
  inactiveCount: number;
  suspendedCount: number;
  page: number;
  limit: number;
}

export interface TenantAdminInfo {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface TenantRepository {
  findAll(filter?: TenantListFilter): Promise<TenantListResult>;
  findById(id: string): Promise<Tenant | null>;
  save(tenant: Tenant): Promise<void>;
  createWithAdmin(tenantData: Partial<Tenant>, adminData: { email: string; name: string; passwordHash: string }): Promise<{ tenant: Tenant; adminId: string }>;
  delete(id: string): Promise<void>;
  getTenantAdmins(companyId: string): Promise<TenantAdminInfo[]>;
  getTenantStats(companyId: string): Promise<{ employeeCount: number; payrollCount: number; activeLeavesCount: number; totalPayrollAmount: number }>;
}
