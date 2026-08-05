import { EmployeeRepository } from "../ports/EmployeeRepository";
import { EmployeeDTO } from "../dto/EmployeeDTO";
import { toEmployeeDTO } from "../mappers/employee-dto.mapper";

export class GetEmployeeByIdUseCase {
  constructor(private readonly repository: EmployeeRepository) {}

  public async execute(companyId: string, id: string): Promise<EmployeeDTO | null> {
    const emp = await this.repository.findByIdForTenant(companyId, id);
    if (!emp) return null;
    return toEmployeeDTO(emp);
  }
}
