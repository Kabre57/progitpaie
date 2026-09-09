export interface SystemHealthDTO {
  status: "HEALTHY" | "DEGRADED" | "CRITICAL";
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  nodeVersion: string;
  process: {
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
    memoryUsagePercentage: number;
  };
  serverOS: {
    platform: string;
    arch: string;
    totalMemMB: number;
    freeMemMB: number;
    usedMemMB: number;
    osMemoryUsagePercentage: number;
    loadAverage: number[];
  };
  database: {
    status: "CONNECTED" | "ERROR";
    latencyMs: number;
    sizePretty: string;
    activeConnections: number;
    version: string;
  };
  redis: {
    status: "CONNECTED" | "DISABLED" | "ERROR";
    latencyMs: number;
  };
  security: {
    failedAudits24h: number;
    totalAudits24h: number;
  };
}
