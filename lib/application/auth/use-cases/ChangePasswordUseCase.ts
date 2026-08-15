import type { AuthIdentityRepository } from "../ports/AuthIdentityRepository";

export type PasswordHasher = (plainPassword: string) => Promise<string>;
export type PasswordComparator = (plainPassword: string, passwordHash: string) => Promise<boolean>;

export class ChangePasswordUseCase {
  public constructor(
    private readonly repository: AuthIdentityRepository,
    private readonly comparePassword: PasswordComparator,
    private readonly hashPassword: PasswordHasher
  ) {}

  public async execute(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.repository.findPasswordById(userId);
    if (!user) throw new Error("AUTH_USER_NOT_FOUND");
    if (!await this.comparePassword(currentPassword, user.passwordHash)) {
      throw new Error("AUTH_INVALID_CURRENT_PASSWORD");
    }
    await this.repository.updatePassword(user.id, await this.hashPassword(newPassword));
  }
}
