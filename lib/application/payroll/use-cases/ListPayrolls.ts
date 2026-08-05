import { PayrollRepository, ListPayrollsQuery } from "../ports/PayrollRepository";
import { PayrollDTO } from "../dto/PayrollDTO";
import { toPayrollDTO } from "../mappers/payroll-dto.mapper";

export class ListPayrollsUseCase {
  constructor(private readonly repository: PayrollRepository) {}

  public async execute(query: ListPayrollsQuery): Promise<readonly PayrollDTO[]> {
    const payrolls = await this.repository.list(query);
    return payrolls.map((p) => toPayrollDTO(p));
  }
}
