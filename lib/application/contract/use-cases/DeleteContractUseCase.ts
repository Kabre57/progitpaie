import { ContractRepository } from "../ports/ContractRepository";

export class DeleteContractUseCase {
  constructor(private readonly contractRepository: ContractRepository) {}

  public async execute(companyId: string, id: string): Promise<boolean> {
    const existing = await this.contractRepository.findByIdForTenant(companyId, id);
    if (!existing) {
      throw new Error("Contrat non trouvé");
    }
    return this.contractRepository.delete(companyId, id);
  }
}
