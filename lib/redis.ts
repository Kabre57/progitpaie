import Redis from "ioredis";

// ═══════════════════════════════════════════════
// Redis Client Singleton
// ═══════════════════════════════════════════════

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  
  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    lazyConnect: true,
  });

  client.on("error", (err) => {
    console.error("❌ Redis connection error:", err.message);
  });

  client.on("connect", () => {
    console.log("✅ Redis connected successfully");
  });

  return client;
}

const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

export default redis;

// ═══════════════════════════════════════════════
// 1. SESSION CACHE
// Cache user sessions to avoid DB lookups on every request
// ═══════════════════════════════════════════════

export async function cacheSession(
  userId: string,
  data: Record<string, unknown>,
  ttl = 3600
): Promise<void> {
  try {
    await redis.set(`session:${userId}`, JSON.stringify(data), "EX", ttl);
  } catch (err) {
    console.error("Redis cacheSession error:", err);
  }
}

export async function getSession(
  userId: string
): Promise<Record<string, unknown> | null> {
  try {
    const data = await redis.get(`session:${userId}`);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Redis getSession error:", err);
    return null;
  }
}

export async function deleteSession(userId: string): Promise<void> {
  try {
    await redis.del(`session:${userId}`);
  } catch (err) {
    console.error("Redis deleteSession error:", err);
  }
}

// ═══════════════════════════════════════════════
// 2. SETTINGS CACHE
// Persistent settings cache (solves the in-memory cache bug)
// ═══════════════════════════════════════════════

export async function cacheSettings(
  key: string,
  value: Record<string, unknown>
): Promise<void> {
  try {
    await redis.set(`settings:${key}`, JSON.stringify(value));
  } catch (err) {
    console.error("Redis cacheSettings error:", err);
  }
}

export async function getSettings(
  key: string
): Promise<Record<string, unknown> | null> {
  try {
    const data = await redis.get(`settings:${key}`);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Redis getSettings error:", err);
    return null;
  }
}

// ═══════════════════════════════════════════════
// 3. RATE LIMITING
// Simple sliding window rate limiter
// ═══════════════════════════════════════════════

export async function checkRateLimit(
  identifier: string,
  limit = 100,
  windowSeconds = 60
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const key = `rate:${identifier}`;
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }
    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
    };
  } catch (err) {
    console.error("Redis checkRateLimit error:", err);
    // Fail open - allow the request if Redis is down
    return { allowed: true, remaining: limit };
  }
}

// ═══════════════════════════════════════════════
// 4. NOTIFICATION COUNTERS
// Fast unread count without DB queries
// ═══════════════════════════════════════════════

export async function incrUnreadNotifications(
  userId: string
): Promise<void> {
  try {
    await redis.incr(`unread:${userId}`);
  } catch (err) {
    console.error("Redis incrUnreadNotifications error:", err);
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const count = await redis.get(`unread:${userId}`);
    return count ? parseInt(count, 10) : 0;
  } catch (err) {
    console.error("Redis getUnreadCount error:", err);
    return 0;
  }
}

export async function decrUnreadNotifications(
  userId: string
): Promise<void> {
  try {
    const count = await redis.decr(`unread:${userId}`);
    // Don't let it go negative
    if (count < 0) {
      await redis.set(`unread:${userId}`, "0");
    }
  } catch (err) {
    console.error("Redis decrUnreadNotifications error:", err);
  }
}

export async function resetUnreadCount(userId: string): Promise<void> {
  try {
    await redis.del(`unread:${userId}`);
  } catch (err) {
    console.error("Redis resetUnreadCount error:", err);
  }
}

// ═══════════════════════════════════════════════
// 5. REPORT CACHE
// Cache expensive report queries with TTL
// ═══════════════════════════════════════════════

export async function cacheReport(
  key: string,
  data: unknown,
  ttl = 300
): Promise<void> {
  try {
    await redis.set(`report:${key}`, JSON.stringify(data), "EX", ttl);
  } catch (err) {
    console.error("Redis cacheReport error:", err);
  }
}

export async function getCachedReport(key: string): Promise<unknown | null> {
  try {
    const data = await redis.get(`report:${key}`);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Redis getCachedReport error:", err);
    return null;
  }
}

export async function invalidateReportCache(pattern = "report:*"): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.error("Redis invalidateReportCache error:", err);
  }
}
