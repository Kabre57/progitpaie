export interface PublicEmployeeDirectoryQuery {
  companyId: string;
  search?: string;
  departmentId?: string;
  page: number;
  limit: number;
}

export interface PublicEmployeeDirectoryItem {
  id: string;
  name: string;
  email: string;
  employeeId: string | null;
  jobTitle: string | null;
  contractType: string | null;
  isActive: boolean;
  department: { id: string; name: string } | null;
}

export interface PublicEmployeeDirectoryResult {
  employees: readonly PublicEmployeeDirectoryItem[];
  total: number;
}

export interface PublicEmployeeDirectoryRepository {
  list(query: PublicEmployeeDirectoryQuery): Promise<PublicEmployeeDirectoryResult>;
}
