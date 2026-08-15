import type { DemoAccount, DemoSignupRepository, ExistingAuthUser } from "../ports/DemoSignupRepository";
import type { GoogleIdTokenVerifier } from "../ports/GoogleIdTokenVerifier";

export interface GoogleAuthenticationResult {
  user: ExistingAuthUser;
  isDemo: boolean;
  demoExpiresAt?: Date;
}

export class AuthenticateGoogleUserUseCase {
  public constructor(
    private readonly verifier: GoogleIdTokenVerifier,
    private readonly repository: DemoSignupRepository,
    private readonly now: () => Date = () => new Date()
  ) {}

  public async execute(idToken: string): Promise<GoogleAuthenticationResult> {
    const identity = await this.verifier.verify(idToken);
    const existing = await this.repository.findUserByEmail(identity.email);
    if (existing) {
      if (!existing.isActive) throw new Error("AUTH_ACCOUNT_INACTIVE");
      return { user: existing, isDemo: false };
    }

    const expiresAt = this.now();
    expiresAt.setDate(expiresAt.getDate() + 14);
    const account: DemoAccount = await this.repository.createDemoAccount({
      companyName: `Espace Démo ${identity.name}`,
      name: identity.name,
      email: identity.email,
      passwordHash: `oauth-google:${identity.subject}`,
      expiresAt,
    });
    return { user: account.user, isDemo: true, demoExpiresAt: account.demoExpiresAt };
  }
}
