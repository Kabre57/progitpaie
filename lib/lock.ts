import redis from "./redis";

/**
 * Acquires a distributed lock using Redis SET key value NX PX timeout.
 * Prevents race conditions during concurrent check-in/check-out or payroll processing.
 */
export async function acquireLock(
  lockKey: string,
  ttlMs: number = 5000
): Promise<string | null> {
  try {
    const lockValue = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const result = await redis.set(`lock:${lockKey}`, lockValue, "PX", ttlMs, "NX");
    if (result === "OK") {
      return lockValue;
    }
    return null;
  } catch (error) {
    console.warn("Redis lock fallback (allowing request):", error);
    // Return a dummy lock token in case Redis fails so the app continues gracefully
    return `fallback_${Date.now()}`;
  }
}

/**
 * Releases a distributed lock safely if the lock value matches.
 */
export async function releaseLock(
  lockKey: string,
  lockValue: string
): Promise<boolean> {
  try {
    if (lockValue.startsWith("fallback_")) return true;
    const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    const result = await redis.eval(luaScript, 1, `lock:${lockKey}`, lockValue);
    return result === 1;
  } catch (error) {
    console.error("Redis unlock error:", error);
    return false;
  }
}

/**
 * Helper to run an async operation with an automatic distributed lock.
 */
export async function withLock<T>(
  lockKey: string,
  ttlMs: number,
  fn: () => Promise<T>
): Promise<{ success: true; data: T } | { success: false; error: string; code: string }> {
  const lockToken = await acquireLock(lockKey, ttlMs);
  if (!lockToken) {
    return {
      success: false,
      error: "Opération en cours de traitement. Veuillez patienter.",
      code: "CONCURRENCY_LOCK_ERROR",
    };
  }

  try {
    const data = await fn();
    return { success: true, data };
  } finally {
    await releaseLock(lockKey, lockToken);
  }
}
