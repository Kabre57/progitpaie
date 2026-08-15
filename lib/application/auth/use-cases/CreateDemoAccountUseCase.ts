import type { CreateDemoAccountInput, DemoAccount, DemoSignupRepository } from "../ports/DemoSignupRepository";

export class CreateDemoAccountUseCase {
  public constructor(private readonly repository: DemoSignupRepository) {}

  public async execute(input: CreateDemoAccountInput): Promise<DemoAccount> {
    const existing = await this.repository.findUserByEmail(input.email);
    if (existing) throw new Error("AUTH_EMAIL_ALREADY_REGISTERED");
    return this.repository.createDemoAccount(input);
  }
}
