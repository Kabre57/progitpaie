import type {
  CreateDepartmentInput,
  DepartmentRecord,
  DepartmentRepository,
  UpdateDepartmentInput,
} from "../ports/DepartmentRepository";

export class ListDepartmentsUseCase {
  public constructor(private readonly repository: DepartmentRepository) {}

  public execute(companyId: string, includeInactive: boolean): Promise<readonly DepartmentRecord[]> {
    return this.repository.list(companyId, includeInactive);
  }
}

export class CreateDepartmentUseCase {
  public constructor(private readonly repository: DepartmentRepository) {}

  public async execute(input: CreateDepartmentInput): Promise<DepartmentRecord> {
    const existing = await this.repository.findByName(input.companyId, input.name);
    if (existing) throw new Error("DEPARTMENT_NAME_ALREADY_EXISTS");
    return this.repository.create(input);
  }
}

export class UpdateDepartmentUseCase {
  public constructor(private readonly repository: DepartmentRepository) {}

  public async execute(input: UpdateDepartmentInput): Promise<DepartmentRecord> {
    const current = await this.repository.findById(input.companyId, input.id);
    if (!current) throw new Error("DEPARTMENT_NOT_FOUND");
    if (input.name && input.name !== current.name) {
      const existing = await this.repository.findByName(input.companyId, input.name, input.id);
      if (existing) throw new Error("DEPARTMENT_NAME_ALREADY_EXISTS");
    }
    return this.repository.update(input);
  }
}

export class DeactivateDepartmentUseCase {
  public constructor(private readonly repository: DepartmentRepository) {}

  public async execute(companyId: string, id: string): Promise<void> {
    const current = await this.repository.findById(companyId, id);
    if (!current) throw new Error("DEPARTMENT_NOT_FOUND");
    await this.repository.deactivate(companyId, id);
  }
}
