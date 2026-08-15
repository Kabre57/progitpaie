export interface DepartmentManager {
  id: string;
  name: string | null;
  email: string | null;
}

export interface DepartmentRecord {
  id: string;
  companyId: string;
  name: string;
  description: string;
  managerId: string | null;
  manager: DepartmentManager | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDepartmentInput {
  companyId: string;
  name: string;
  description: string;
  managerId: string | null;
}

export interface UpdateDepartmentInput {
  companyId: string;
  id: string;
  name?: string;
  description?: string;
  managerId?: string | null;
}

export interface DepartmentRepository {
  list(companyId: string, includeInactive: boolean): Promise<readonly DepartmentRecord[]>;
  findById(companyId: string, id: string): Promise<DepartmentRecord | null>;
  findByName(companyId: string, name: string, excludeId?: string): Promise<DepartmentRecord | null>;
  create(input: CreateDepartmentInput): Promise<DepartmentRecord>;
  update(input: UpdateDepartmentInput): Promise<DepartmentRecord>;
  deactivate(companyId: string, id: string): Promise<void>;
}
