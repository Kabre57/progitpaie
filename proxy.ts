import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function decodeJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const token = request.cookies.get("rbeas_token")?.value;
  const path = request.nextUrl.pathname;

  // ═══════════════════════════════════════════════
  // 1. HTTP Security Headers
  // ═══════════════════════════════════════════════
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self)"
  );
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  // Content-Security-Policy (CSP)
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https:;
    font-src 'self' data:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, " ").trim();

  response.headers.set("Content-Security-Policy", cspHeader);

  // Redirection immédiate de la racine (/) vers /login ou le tableau de bord
  if (path === "/") {
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded && (!decoded.exp || Date.now() < decoded.exp * 1000)) {
        const dest = decoded.role === "admin" ? "/admin" : "/employee";
        return NextResponse.redirect(new URL(dest, request.url));
      }
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ═══════════════════════════════════════════════
  // 2. Authentication & Authorization Routing
  // ═══════════════════════════════════════════════
  if (
    path.startsWith("/dashboard") ||
    path.startsWith("/admin") ||
    path.startsWith("/employee") ||
    path.startsWith("/api/admin")
  ) {
    if (!token) {
      if (path.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, error: "Authentification requise", code: "UNAUTHORIZED" },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const decoded = decodeJwt(token);
    if (!decoded || !decoded.role) {
      if (path.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, error: "Token invalide", code: "UNAUTHORIZED" },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Role check for admin routes
    if (path.startsWith("/admin") || path.startsWith("/api/admin")) {
      if (decoded.role !== "admin") {
        if (path.startsWith("/api/")) {
          return NextResponse.json(
            { success: false, error: "Accès administrateur requis", code: "FORBIDDEN" },
            { status: 403 }
          );
        }
        return NextResponse.redirect(new URL("/employee", request.url));
      }
    }

    // Role check for employee routes
    if (path.startsWith("/employee")) {
      if (decoded.role !== "employee") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }

    return response;
  }

  // Redirect signed-in users away from auth pages
  if (path === "/login" || path === "/register") {
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded && (!decoded.exp || Date.now() < decoded.exp * 1000)) {
        const dest = decoded.role === "admin" ? "/admin" : "/employee";
        return NextResponse.redirect(new URL(dest, request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};

export default proxy;
