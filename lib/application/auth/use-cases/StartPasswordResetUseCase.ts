import type { AuthIdentityRepository } from "../ports/AuthIdentityRepository";

export class StartPasswordResetUseCase {
  public constructor(private readonly repository: AuthIdentityRepository) {}

  public execute(email: string, token: string, expiresAt: Date): Promise<boolean> {
    return this.repository.saveResetTokenForActiveUser(email, token, expiresAt);
  }
}
