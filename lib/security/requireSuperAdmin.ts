import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
  companyId?: string;
}

export async function requireSuperAdmin(request: NextRequest): Promise<AuthenticatedUser | NextResponse> {
  const authHeader = request.headers.get("authorization");
  let token: string | undefined;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else {
    // The login route creates `rbeas_token`. Keep `token` as a fallback so
    // existing sessions created by older deployments remain usable.
    token = request.cookies.get("rbeas_token")?.value ?? request.cookies.get("token")?.value;
  }

  if (!token) {
    return NextResponse.json(
      { success: false, error: "Authentification requise" },
      { status: 401 }
    );
  }

  const decoded = await verifyToken(token);
  if (!decoded) {
    return NextResponse.json(
      { success: false, error: "Jeton d'accès invalide ou expiré" },
      { status: 401 }
    );
  }

  // Seuls le rôle super_admin ou les administrateurs généraux ont l'accès global
  if (decoded.role !== "super_admin" && decoded.role !== "admin") {
    return NextResponse.json(
      { success: false, error: "Accès restreint au Super Administrateur" },
      { status: 403 }
    );
  }

  return {
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role,
    companyId: decoded.companyId ?? undefined,
  };
}
