import os from "os";
import { prisma } from "@/lib/db";
import redis from "@/lib/redis";
import { SystemHealthRepository } from "@/lib/application/admin/ports/SystemHealthRepository";
import { SystemHealthDTO } from "@/lib/application/admin/dto/SystemHealthDTO";

export class PrismaSystemHealthRepository implements SystemHealthRepository {
  async getSystemHealth(): Promise<SystemHealthDTO> {
    const startDb = Date.now();
    let dbStatus: "CONNECTED" | "ERROR" = "CONNECTED";
    let dbLatencyMs = 0;
    let dbSize = "N/A";
    let dbVersion = "PostgreSQL";
    let dbActiveConnections = 1;

    try {
      const dbRes: Array<{ size: string; version: string; connections: number }> = await prisma.$queryRaw`
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as size,
          version() as version,
          (SELECT count(*)::int FROM pg_stat_activity WHERE datname = current_database()) as connections;
      `;
      dbLatencyMs = Date.now() - startDb;
      if (dbRes && dbRes[0]) {
        dbSize = dbRes[0].size || "N/A";
        dbVersion = (dbRes[0].version || "").split(" ")[0] + " " + (dbRes[0].version || "").split(" ")[1];
        dbActiveConnections = Number(dbRes[0].connections) || 1;
      }
    } catch (err) {
      console.error("DB health check error:", err);
      dbStatus = "ERROR";
      dbLatencyMs = Date.now() - startDb;
    }

    const startRedis = Date.now();
    let redisStatus: "CONNECTED" | "DISABLED" | "ERROR" = "CONNECTED";
    let redisLatencyMs = 0;

    try {
      const pong = await redis.ping();
      redisLatencyMs = Date.now() - startRedis;
      if (pong !== "PONG") {
        redisStatus = "ERROR";
      }
    } catch {
      redisStatus = "ERROR";
      redisLatencyMs = Date.now() - startRedis;
    }

    // Node & Process memory
    const memory = process.memoryUsage();
    const heapUsedMB = Math.round(memory.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memory.heapTotal / 1024 / 1024);
    const rssMB = Math.round(memory.rss / 1024 / 1024);
    const memoryUsagePercentage = heapTotalMB > 0 ? Math.round((heapUsedMB / heapTotalMB) * 100) : 0;

    // OS memory
    const totalMemMB = Math.round(os.totalmem() / 1024 / 1024);
    const freeMemMB = Math.round(os.freemem() / 1024 / 1024);
    const usedMemMB = totalMemMB - freeMemMB;
    const osMemoryUsagePercentage = totalMemMB > 0 ? Math.round((usedMemMB / totalMemMB) * 100) : 0;

    // Audits 24h
    let failedAudits24h = 0;
    let totalAudits24h = 0;
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const [total, failed] = await Promise.all([
        prisma.auditLog.count({ where: { timestamp: { gte: twentyFourHoursAgo } } }),
        prisma.auditLog.count({
          where: {
            timestamp: { gte: twentyFourHoursAgo },
            action: { contains: "ERROR" },
          },
        }),
      ]);
      totalAudits24h = total;
      failedAudits24h = failed;
    } catch {
      // ignore
    }

    let globalStatus: "HEALTHY" | "DEGRADED" | "CRITICAL" = "HEALTHY";
    if (dbStatus === "ERROR") {
      globalStatus = "CRITICAL";
    } else if (redisStatus === "ERROR" || osMemoryUsagePercentage > 90 || dbLatencyMs > 200) {
      globalStatus = "DEGRADED";
    }

    return {
      status: globalStatus,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      environment: process.env.NODE_ENV || "production",
      nodeVersion: process.version,
      process: {
        heapUsedMB,
        heapTotalMB,
        rssMB,
        memoryUsagePercentage,
      },
      serverOS: {
        platform: os.platform(),
        arch: os.arch(),
        totalMemMB,
        freeMemMB,
        usedMemMB,
        osMemoryUsagePercentage,
        loadAverage: os.loadavg ? os.loadavg() : [0, 0, 0],
      },
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        sizePretty: dbSize,
        activeConnections: dbActiveConnections,
        version: dbVersion,
      },
      redis: {
        status: redisStatus,
        latencyMs: redisLatencyMs,
      },
      security: {
        failedAudits24h,
        totalAudits24h,
      },
    };
  }
}
