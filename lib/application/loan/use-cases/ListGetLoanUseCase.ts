import { LoanRepository, ListLoansQuery } from "../ports/LoanRepository";
import { LoanDTO } from "../dto/LoanDTO";
import { toLoanDTO } from "../mappers/loan-dto.mapper";

export class ListLoansUseCase {
  constructor(private readonly repository: LoanRepository) {}

  public async execute(query: ListLoansQuery): Promise<readonly LoanDTO[]> {
    const list = await this.repository.list(query);
    return list.map((item) => toLoanDTO(item));
  }
}

export class GetLoanByIdUseCase {
  constructor(private readonly repository: LoanRepository) {}

  public async execute(companyId: string, id: string): Promise<LoanDTO | null> {
    const loan = await this.repository.findByIdForTenant(companyId, id);
    if (!loan) return null;
    return toLoanDTO(loan);
  }
}
