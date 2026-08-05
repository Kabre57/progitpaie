import { EmployeeRepository } from "../ports/EmployeeRepository";
import { EmployeeDTO } from "../dto/EmployeeDTO";
import { toEmployeeDTO } from "../mappers/employee-dto.mapper";

export class SoftDeleteEmployeeUseCase {
  constructor(private readonly repository: EmployeeRepository) {}

  public async execute(companyId: string, id: string): Promise<EmployeeDTO> {
    const existing = await this.repository.findByIdForTenant(companyId, id);
    if (!existing) {
      throw new Error("Salarié non trouvé");
    }

    existing.deactivate();
    const saved = await this.repository.save(existing);
    return toEmployeeDTO(saved);
  }
}
