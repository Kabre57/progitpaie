import { SuperAdminMemberDTO, CreateSuperAdminInput, UpdateSuperAdminInput } from "../dto/SuperAdminTeamDTO";

export interface SuperAdminTeamRepository {
  listSuperAdmins(): Promise<SuperAdminMemberDTO[]>;
  createSuperAdmin(input: CreateSuperAdminInput, hashedPassword: string): Promise<SuperAdminMemberDTO>;
  updateSuperAdmin(input: UpdateSuperAdminInput, hashedPassword?: string): Promise<SuperAdminMemberDTO>;
  deleteSuperAdmin(id: string): Promise<void>;
  countSuperAdmins(): Promise<number>;
  findByEmail(email: string): Promise<SuperAdminMemberDTO | null>;
}
