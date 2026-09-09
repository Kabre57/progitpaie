import { ProvisionTenantRepository } from "../ports/ProvisionTenantRepository";
import { ProvisionTenantInput, ProvisionTenantResultDTO } from "../dto/ProvisionTenantDTO";

export type HashPasswordFn = (password: string) => Promise<string>;

export class ProvisionTenantWithTemplateUseCase {
  constructor(
    private readonly repo: ProvisionTenantRepository,
    private readonly hashPassword: HashPasswordFn
  ) {}

  async execute(input: ProvisionTenantInput): Promise<ProvisionTenantResultDTO> {
    if (!input.name || input.name.trim().length < 2) {
      throw new Error("Le nom de l'entreprise est obligatoire (2 caractères minimum)");
    }
    if (!input.adminEmail || !input.adminEmail.includes("@")) {
      throw new Error("L'email de l'administrateur est invalide");
    }

    const emailTaken = await this.repo.isEmailTaken(input.adminEmail);
    if (emailTaken) {
      throw new Error("Cet email d'administrateur est déjà utilisé dans le système");
    }

    if (!input.adminPassword || input.adminPassword.length < 8) {
      throw new Error("Le mot de passe administrateur est obligatoire et doit contenir au moins 8 caractères");
    }

    const hashedPassword = await this.hashPassword(input.adminPassword);
    return this.repo.provisionTenant(input, hashedPassword);
  }
}
