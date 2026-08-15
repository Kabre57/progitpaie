import type { AuthIdentityRepository, AuthSessionProfile } from "../ports/AuthIdentityRepository";

export class GetSessionProfileUseCase {
  public constructor(private readonly repository: AuthIdentityRepository) {}

  public async execute(userId: string): Promise<AuthSessionProfile> {
    const profile = await this.repository.findSessionProfileById(userId);
    if (!profile) throw new Error("AUTH_SESSION_USER_NOT_FOUND");
    return profile;
  }
}
