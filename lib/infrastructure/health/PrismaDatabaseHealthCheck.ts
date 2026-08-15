import type { DatabaseHealthCheck } from "@/lib/application/health/ports/DatabaseHealthCheck";
import { prisma } from "@/lib/db";

export class PrismaDatabaseHealthCheck implements DatabaseHealthCheck {
  public async ping(): Promise<void> {
    await prisma.$queryRaw`SELECT 1`;
  }
}
