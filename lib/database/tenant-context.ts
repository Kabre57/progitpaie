import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/middleware-helpers";
import type { ApiResponse, UserRole } from "@/types";

export interface AuthenticatedTenant {
  userId: string;
  email: string;
  role: UserRole;
  companyId: string;
}

export async function getDefaultCompanyId(): Promise<string> {
  const company = await prisma.company.findFirst({
    where: { isMain: true, isActive: true },
    select: { id: true },
  });
  if (!company) throw new Error("Aucune société principale active n'est configurée");
  return company.id;
}

export async function requireTenant(
  request: Request,
  requiredRole?: UserRole
): Promise<AuthenticatedTenant | NextResponse<ApiResponse<never>>> {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const currentUser = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, email: true, role: true, companyId: true, isActive: true },
  });

  if (!currentUser?.isActive) {
    return NextResponse.json(
      { success: false, error: "Session révoquée", code: "SESSION_REVOKED" },
      { status: 401 }
    );
  }

  if (requiredRole && currentUser.role !== requiredRole) {
    return NextResponse.json(
      { success: false, error: "Accès interdit", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  if (!currentUser.companyId) {
    return NextResponse.json(
      { success: false, error: "Aucune société associée à ce compte", code: "TENANT_REQUIRED" },
      { status: 403 }
    );
  }

  return {
    userId: currentUser.id,
    email: currentUser.email,
    role: currentUser.role,
    companyId: currentUser.companyId,
  };
}
