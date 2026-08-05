import { EmployeeRepository, ListEmployeesQuery } from "../ports/EmployeeRepository";
import { EmployeeDTO } from "../dto/EmployeeDTO";
import { toEmployeeDTO } from "../mappers/employee-dto.mapper";

export class ListEmployeesUseCase {
  constructor(private readonly repository: EmployeeRepository) {}

  public async execute(query: ListEmployeesQuery): Promise<readonly EmployeeDTO[]> {
    const list = await this.repository.list(query);
    return list.map((emp) => toEmployeeDTO(emp));
  }
}
