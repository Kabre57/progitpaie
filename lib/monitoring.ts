/**
 * Monitoring and Error Observability helper (Sentry + Unified Logger)
 */

interface ErrorContext {
  userId?: string;
  route?: string;
  action?: string;
  extra?: Record<string, unknown>;
}

export function captureException(error: unknown, context?: ErrorContext): void {
  const timestamp = new Date().toISOString();
  console.error(`[SENTRY/MONITORING LOG - ${timestamp}]`, {
    error: error instanceof Error ? error.stack || error.message : error,
    context,
  });

  // If SENTRY_DSN is configured in environment, capture to Sentry
  if (process.env.SENTRY_DSN) {
    try {
      // Dynamic import to avoid crash if @sentry/nextjs is not installed yet
      const Sentry = require("@sentry/nextjs");
      Sentry.captureException(error, {
        user: context?.userId ? { id: context.userId } : undefined,
        tags: { route: context?.route, action: context?.action },
        extra: context?.extra,
      });
    } catch {
      // Silently fall back to console logging if Sentry library is uninitialized
    }
  }
}

export function logEvent(message: string, level: "info" | "warn" | "error" = "info", extra?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  console.log(`[APP LOG - ${level.toUpperCase()} - ${timestamp}] ${message}`, extra || "");
}
