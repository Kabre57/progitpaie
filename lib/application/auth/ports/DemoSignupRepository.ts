export interface ExistingAuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId: string | null;
  isActive: boolean;
}

export interface CreateDemoAccountInput {
  companyName: string;
  name: string;
  email: string;
  passwordHash: string;
  departmentName?: string;
  expiresAt: Date;
}

export interface DemoAccount {
  user: ExistingAuthUser;
  demoExpiresAt: Date;
}

export interface DemoSignupRepository {
  findUserByEmail(email: string): Promise<ExistingAuthUser | null>;
  createDemoAccount(input: CreateDemoAccountInput): Promise<DemoAccount>;
}
