import type {
  CreateShiftInput,
  ShiftRecord,
  ShiftRepository,
  UpdateShiftInput,
} from "../ports/ShiftRepository";

export class ListShiftsUseCase {
  public constructor(private readonly repository: ShiftRepository) {}

  public execute(companyId: string, includeInactive: boolean): Promise<readonly ShiftRecord[]> {
    return this.repository.list(companyId, includeInactive);
  }
}

export class CreateShiftUseCase {
  public constructor(private readonly repository: ShiftRepository) {}

  public async execute(input: CreateShiftInput): Promise<ShiftRecord> {
    const existing = await this.repository.findByName(input.companyId, input.name);
    if (existing) throw new Error("SHIFT_NAME_ALREADY_EXISTS");
    return this.repository.create(input);
  }
}

export class UpdateShiftUseCase {
  public constructor(private readonly repository: ShiftRepository) {}

  public async execute(input: UpdateShiftInput): Promise<ShiftRecord> {
    const current = await this.repository.findById(input.companyId, input.id);
    if (!current) throw new Error("SHIFT_NOT_FOUND");
    if (input.name && input.name !== current.name) {
      const existing = await this.repository.findByName(input.companyId, input.name, input.id);
      if (existing) throw new Error("SHIFT_NAME_ALREADY_EXISTS");
    }
    return this.repository.update(input);
  }
}

export class DeactivateShiftUseCase {
  public constructor(private readonly repository: ShiftRepository) {}

  public async execute(companyId: string, id: string): Promise<void> {
    const current = await this.repository.findById(companyId, id);
    if (!current) throw new Error("SHIFT_NOT_FOUND");
    await this.repository.deactivate(companyId, id);
  }
}
