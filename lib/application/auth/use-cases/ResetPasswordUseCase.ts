import type { AuthIdentityRepository } from "../ports/AuthIdentityRepository";

export type ResetPasswordHasher = (plainPassword: string) => Promise<string>;

export class ResetPasswordUseCase {
  public constructor(
    private readonly repository: AuthIdentityRepository,
    private readonly hashPassword: ResetPasswordHasher,
    private readonly now: () => Date = () => new Date()
  ) {}

  public async execute(token: string, newPassword: string): Promise<void> {
    const changed = await this.repository.resetPasswordFromValidToken(
      token,
      await this.hashPassword(newPassword),
      this.now()
    );
    if (!changed) throw new Error("AUTH_RESET_TOKEN_INVALID");
  }
}
