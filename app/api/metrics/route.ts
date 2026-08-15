import { NextResponse } from "next/server";
import { CheckDatabaseHealthUseCase } from "@/lib/application/health/use-cases/CheckDatabaseHealthUseCase";
import { PrismaDatabaseHealthCheck } from "@/lib/infrastructure/health/PrismaDatabaseHealthCheck";

const checkDatabaseHealth = new CheckDatabaseHealthUseCase(new PrismaDatabaseHealthCheck());

export async function GET(): Promise<Response> {
  let databaseStatus = 1;
  try {
    await checkDatabaseHealth.execute();
  } catch {
    databaseStatus = 0;
  }

  const memory = process.memoryUsage();
  const uptime = process.uptime();
  const metrics = `
# HELP progitpaie_up Statut de l'application (1 = UP, 0 = DOWN)
# TYPE progitpaie_up gauge
progitpaie_up 1

# HELP progitpaie_database_up Statut de la base de données PostgreSQL
# TYPE progitpaie_database_up gauge
progitpaie_database_up ${databaseStatus}

# HELP progitpaie_memory_heap_bytes Utilisation mémoire Heap en octets
# TYPE progitpaie_memory_heap_bytes gauge
progitpaie_memory_heap_bytes ${memory.heapUsed}

# HELP progitpaie_uptime_seconds Uptime du processus Next.js en secondes
# TYPE progitpaie_uptime_seconds counter
progitpaie_uptime_seconds ${Math.floor(uptime)}
`.trim();

  return new NextResponse(metrics, {
    headers: { "Content-Type": "text/plain; version=0.0.4; charset=utf-8" },
  });
}
