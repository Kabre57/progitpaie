import { TenantRepository } from "../ports/TenantRepository";

export class DeleteTenantUseCase {
  constructor(private tenantRepo: TenantRepository) {}

  public async execute(id: string, confirmationName: string) {
    const tenant = await this.tenantRepo.findById(id);
    if (!tenant) {
      throw new Error(`Entreprise non trouvée: ${id}`);
    }

    if (tenant.isMain) {
      throw new Error("L'entreprise principale (siège) ne peut jamais être supprimée");
    }

    if (confirmationName.trim().toLowerCase() !== tenant.name.trim().toLowerCase()) {
      throw new Error("Le nom de confirmation saisi ne correspond pas à la raison sociale de l'entreprise");
    }

    await this.tenantRepo.delete(id);
    return { success: true, deletedId: id };
  }
}
