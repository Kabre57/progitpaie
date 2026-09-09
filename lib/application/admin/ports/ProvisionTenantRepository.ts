import { ProvisionTenantInput, ProvisionTenantResultDTO } from "../dto/ProvisionTenantDTO";

export interface ProvisionTenantRepository {
  provisionTenant(input: ProvisionTenantInput, hashedPassword: string): Promise<ProvisionTenantResultDTO>;
  isEmailTaken(email: string): Promise<boolean>;
}
