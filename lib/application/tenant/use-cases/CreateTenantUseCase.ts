import bcrypt from "bcryptjs";
import { TenantRepository } from "../ports/TenantRepository";
import { CreateTenantInputDTO } from "../dto/TenantDTO";
import { TenantMapper } from "../mappers/tenant.mapper";

export class CreateTenantUseCase {
  constructor(private tenantRepo: TenantRepository) {}

  public async execute(input: CreateTenantInputDTO) {
    if (!input.name || input.name.trim().length === 0) {
      throw new Error("La raison sociale de l'entreprise est obligatoire");
    }
    if (!input.adminEmail || !input.adminPassword) {
      throw new Error("L'email et le mot de passe de l'administrateur principal sont obligatoires");
    }
    if (input.adminPassword.length < 8) {
      throw new Error("Le mot de passe de l'administrateur doit contenir au moins 8 caractères");
    }

    const hashedPassword = await bcrypt.hash(input.adminPassword, 10);

    const result = await this.tenantRepo.createWithAdmin(
      {
        name: input.name.trim(),
        taxNumber: input.taxNumber?.trim(),
        cnpsNumber: input.cnpsNumber?.trim(),
        rccm: input.rccm?.trim(),
        address: input.address?.trim(),
        city: input.city?.trim() || "Abidjan",
        country: input.country?.trim() || "Côte d'Ivoire",
        phone: input.phone?.trim(),
        email: input.email?.trim(),
      },
      {
        email: input.adminEmail.trim().toLowerCase(),
        name: input.adminName.trim(),
        passwordHash: hashedPassword,
      }
    );

    return {
      tenant: TenantMapper.toDTO(result.tenant),
      adminId: result.adminId,
    };
  }
}
