export interface AuthIdentity {
  id: string;
  email: string;
  name: string;
  role: string;
  passwordHash: string;
  isActive: boolean;
  mustChangePassword: boolean;
  companyId: string | null;
}

export interface AuthSessionProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  employeeId: string | null;
  departmentId: string | null;
  departmentName: string | null;
  leaveBalanceAnnual: number | null;
  leaveBalanceSick: number | null;
  leaveBalanceCasual: number | null;
  salary: number;
  sursalaire: number;
  joiningDate: Date | null;
  createdAt: Date;
  roleId: string | null;
  roleName: string | null;
  permissions: string[];
}

export interface AuthPasswordRecord {
  id: string;
  passwordHash: string;
}

export interface AuthIdentityRepository {
  findByEmail(email: string): Promise<AuthIdentity | null>;
  findSessionProfileById(id: string): Promise<AuthSessionProfile | null>;
  findPasswordById(id: string): Promise<AuthPasswordRecord | null>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
  saveResetTokenForActiveUser(email: string, token: string, expiresAt: Date): Promise<boolean>;
  resetPasswordFromValidToken(token: string, passwordHash: string, now: Date): Promise<boolean>;
}
