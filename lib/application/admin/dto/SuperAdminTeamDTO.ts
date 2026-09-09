export interface SuperAdminMemberDTO {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface CreateSuperAdminInput {
  name: string;
  email: string;
  password: string;
}

export interface UpdateSuperAdminInput {
  id: string;
  name?: string;
  isActive?: boolean;
  password?: string;
}
