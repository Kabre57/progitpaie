import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const startTime = Date.now();

  try {
    // Check de la base de données PostgreSQL
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - startTime;

    // Métriques mémoire système
    const memoryUsage = process.memoryUsage();

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      latencyMs: dbLatency,
      checks: {
        database: { status: "up", latencyMs: dbLatency },
        memory: {
          heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
        },
        uptimeSeconds: Math.floor(process.uptime()),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error.message || "Erreur de connexion à la base de données",
      },
      { status: 503 }
    );
  }
}
