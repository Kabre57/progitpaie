import { ContractRepository, ListContractsQuery } from "../ports/ContractRepository";
import { ContractDTO } from "../dto/ContractDTO";
import { toContractDTO } from "../mappers/contract-dto.mapper";

export class ListContractsUseCase {
  constructor(private readonly repository: ContractRepository) {}

  public async execute(query: ListContractsQuery): Promise<readonly ContractDTO[]> {
    const list = await this.repository.list(query);
    return list.map((item) => toContractDTO(item));
  }
}

export class GetContractByIdUseCase {
  constructor(private readonly repository: ContractRepository) {}

  public async execute(companyId: string, id: string): Promise<ContractDTO | null> {
    const contract = await this.repository.findByIdForTenant(companyId, id);
    if (!contract) return null;
    return toContractDTO(contract);
  }
}
