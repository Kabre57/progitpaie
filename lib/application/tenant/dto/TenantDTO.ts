export interface TenantDTO {
  id: string;
  name: string;
  taxNumber?: string;
  cnpsNumber?: string;
  rccm?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  isMain: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  employeeCount?: number;
  payrollCount?: number;
}

export interface CreateTenantInputDTO {
  name: string;
  taxNumber?: string;
  cnpsNumber?: string;
  rccm?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}
