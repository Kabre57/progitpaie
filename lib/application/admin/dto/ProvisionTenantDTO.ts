/**
 * Données d'entrée pour la création d'une nouvelle entreprise cliente (Tenant).
 */
export interface ProvisionTenantInput {
  name: string;
  taxNumber?: string;
  cnpsNumber?: string;
  rccm?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  plan?: "FREE_TRIAL" | "STARTER" | "BUSINESS" | "ENTERPRISE";
}

/**
 * Résultat du provisioning d'une entreprise.
 */
export interface ProvisionTenantResultDTO {
  company: {
    id: string;
    name: string;
    isDemo: boolean;
    plan: string;
    city: string;
  };
  adminUser: {
    id: string;
    email: string;
    name: string;
  };
  departmentsCreated: number;
  sampleEmployeesCreated: number;
}
