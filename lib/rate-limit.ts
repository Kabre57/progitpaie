import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/redis";

function getClientIdentifier(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
}

/** Returns a 429 response when the client has exceeded the endpoint limit. */
export async function enforceRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowSeconds: number
): Promise<NextResponse | null> {
  const result = await checkRateLimit(
    `${scope}:${getClientIdentifier(request)}`,
    limit,
    windowSeconds
  );

  if (result.allowed) return null;

  return NextResponse.json(
    { success: false, error: "Trop de requêtes. Réessayez plus tard.", code: "RATE_LIMITED" },
    { status: 429, headers: { "Retry-After": String(windowSeconds) } }
  );
}
