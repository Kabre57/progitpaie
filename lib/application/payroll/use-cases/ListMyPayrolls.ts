import { PayrollRepository, ListMyPayrollsQuery } from "../ports/PayrollRepository";
import { PayrollDTO } from "../dto/PayrollDTO";
import { toPayrollDTO } from "../mappers/payroll-dto.mapper";

export class ListMyPayrollsUseCase {
  constructor(private readonly repository: PayrollRepository) {}

  public async execute(query: ListMyPayrollsQuery): Promise<readonly PayrollDTO[]> {
    const payrolls = await this.repository.listMy(query);
    return payrolls.map((p) => toPayrollDTO(p));
  }
}
