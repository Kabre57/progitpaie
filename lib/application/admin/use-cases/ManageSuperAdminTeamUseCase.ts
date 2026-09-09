import { SuperAdminTeamRepository } from "../ports/SuperAdminTeamRepository";
import { SuperAdminMemberDTO, CreateSuperAdminInput, UpdateSuperAdminInput } from "../dto/SuperAdminTeamDTO";

export type HashPasswordFn = (password: string) => Promise<string>;

export class ManageSuperAdminTeamUseCase {
  constructor(
    private readonly repo: SuperAdminTeamRepository,
    private readonly hashPassword: HashPasswordFn
  ) {}

  async listMembers(): Promise<SuperAdminMemberDTO[]> {
    return this.repo.listSuperAdmins();
  }

  async inviteMember(input: CreateSuperAdminInput): Promise<SuperAdminMemberDTO> {
    if (!input.name || input.name.trim().length < 2) {
      throw new Error("Le nom complet est obligatoire");
    }
    if (!input.email || !input.email.includes("@")) {
      throw new Error("L'adresse email est invalide");
    }

    const existing = await this.repo.findByEmail(input.email);
    if (existing) {
      throw new Error("Un utilisateur avec cet email existe déjà");
    }

    if (!input.password || input.password.length < 12) {
      throw new Error("Le mot de passe Super Admin est obligatoire et doit comporter au moins 12 caractères");
    }

    const hashedPassword = await this.hashPassword(input.password);
    return this.repo.createSuperAdmin(input, hashedPassword);
  }

  async updateMember(input: UpdateSuperAdminInput): Promise<SuperAdminMemberDTO> {
    let hashedPassword: string | undefined;
    if (input.password) {
      if (input.password.length < 12) {
        throw new Error("Le mot de passe Super Admin doit comporter au moins 12 caractères");
      }
      hashedPassword = await this.hashPassword(input.password);
    }

    return this.repo.updateSuperAdmin(input, hashedPassword);
  }

  async revokeMember(actorUserId: string, targetMemberId: string): Promise<void> {
    if (actorUserId === targetMemberId) {
      throw new Error("Vous ne pouvez pas révoquer votre propre compte Super Admin");
    }

    const activeCount = await this.repo.countSuperAdmins();
    if (activeCount <= 1) {
      throw new Error("Impossible de supprimer le dernier Super Administrateur actif");
    }

    await this.repo.deleteSuperAdmin(targetMemberId);
  }
}
