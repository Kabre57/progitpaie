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

    if ("delete" in this.repository && typeof (this.repository as { delete?: unknown }).delete === "function") {
      await (this.repository as { delete: (companyId: string, id: string) => Promise<boolean> }).delete(companyId, id);
      existing.deactivate();
      return toEmployeeDTO(existing);
    }

    existing.deactivate();
    const saved = await this.repository.save(existing);
    return toEmployeeDTO(saved);
  }
}
