export interface ShiftRecord {
  id: string;
  companyId: string;
  name: string;
  startTime: string;
  endTime: string;
  workingHours: number;
  lateThresholdMinutes: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateShiftInput {
  companyId: string;
  name: string;
  startTime: string;
  endTime: string;
  workingHours: number;
  lateThresholdMinutes: number;
}

export interface UpdateShiftInput {
  companyId: string;
  id: string;
  name?: string;
  startTime?: string;
  endTime?: string;
  workingHours?: number;
  lateThresholdMinutes?: number;
}

export interface ShiftRepository {
  list(companyId: string, includeInactive: boolean): Promise<readonly ShiftRecord[]>;
  findById(companyId: string, id: string): Promise<ShiftRecord | null>;
  findByName(companyId: string, name: string, excludeId?: string): Promise<ShiftRecord | null>;
  create(input: CreateShiftInput): Promise<ShiftRecord>;
  update(input: UpdateShiftInput): Promise<ShiftRecord>;
  deactivate(companyId: string, id: string): Promise<void>;
}
