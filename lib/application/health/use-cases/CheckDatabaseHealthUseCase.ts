import type { DatabaseHealthCheck } from "../ports/DatabaseHealthCheck";

export class CheckDatabaseHealthUseCase {
  public constructor(private readonly database: DatabaseHealthCheck) {}

  public async execute(): Promise<{ latencyMs: number }> {
    const startedAt = Date.now();
    await this.database.ping();
    return { latencyMs: Date.now() - startedAt };
  }
}
