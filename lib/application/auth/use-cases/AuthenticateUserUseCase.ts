import type { AuthIdentity, AuthIdentityRepository } from "../ports/AuthIdentityRepository";

export type PasswordVerifier = (plainPassword: string, passwordHash: string) => Promise<boolean>;

export class AuthenticateUserUseCase {
  public constructor(
    private readonly repository: AuthIdentityRepository,
    private readonly verifyPassword: PasswordVerifier
  ) {}

  public async execute(email: string, password: string): Promise<AuthIdentity> {
    const identity = await this.repository.findByEmail(email);
    if (!identity) throw new Error("AUTH_INVALID_CREDENTIALS");
    if (!identity.isActive) throw new Error("AUTH_ACCOUNT_INACTIVE");
    if (!await this.verifyPassword(password, identity.passwordHash)) {
      throw new Error("AUTH_INVALID_CREDENTIALS");
    }
    return identity;
  }
}
