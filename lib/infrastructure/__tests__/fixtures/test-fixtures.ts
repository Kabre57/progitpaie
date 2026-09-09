import type { AuthenticatedTenant } from "@/lib/database/tenant-context";

/**
 * ═══════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Fixtures de Test Déterministes 🧪
 * ═══════════════════════════════════════════════════════════════════════
 */

export const mockCompanyA = {
  id: "company_test_aaa_001",
  name: "Entreprise Test A CI",
  taxNumber: "CC-TEST-001",
  cnpsNumber: "CNPS-TEST-001",
  isActive: true,
};

export const mockCompanyB = {
  id: "company_test_bbb_002",
  name: "Entreprise Test B CI",
  taxNumber: "CC-TEST-002",
  cnpsNumber: "CNPS-TEST-002",
  isActive: true,
};

export const mockAdminTenantA: AuthenticatedTenant = {
  userId: "user_admin_a_001",
  email: "admin@companya.ci",
  role: "admin",
  companyId: mockCompanyA.id,
};

export const mockEmployeeTenantA: AuthenticatedTenant = {
  userId: "user_employee_a_001",
  email: "employee@companya.ci",
  role: "employee",
  companyId: mockCompanyA.id,
};

export const mockAdminTenantB: AuthenticatedTenant = {
  userId: "user_admin_b_002",
  email: "admin@companyb.ci",
  role: "admin",
  companyId: mockCompanyB.id,
};

export const mockSuperAdminTenant: AuthenticatedTenant = {
  userId: "user_super_admin_999",
  email: "superadmin@progitpaie.online",
  role: "super_admin",
  companyId: mockCompanyA.id,
};
