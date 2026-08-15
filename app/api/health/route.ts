import { NextResponse } from "next/server";
import { CheckDatabaseHealthUseCase } from "@/lib/application/health/use-cases/CheckDatabaseHealthUseCase";
import { PrismaDatabaseHealthCheck } from "@/lib/infrastructure/health/PrismaDatabaseHealthCheck";

const checkDatabaseHealth = new CheckDatabaseHealthUseCase(new PrismaDatabaseHealthCheck());

export async function GET(): Promise<Response> {
  try {
    const { latencyMs } = await checkDatabaseHealth.execute();
    const memoryUsage = process.memoryUsage();

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      latencyMs,
      checks: {
        database: { status: "up", latencyMs },
        memory: {
          heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
        },
        uptimeSeconds: Math.floor(process.uptime()),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur de connexion à la base de données";
    return NextResponse.json(
      { status: "unhealthy", timestamp: new Date().toISOString(), error: message },
      { status: 503 }
    );
  }
}
