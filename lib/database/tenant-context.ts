import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/middleware-helpers";
import type { ApiResponse, UserRole } from "@/types";
import { RoleValidator } from "@/lib/domain/auth/entities/Role";

export interface AuthenticatedTenant {
  userId: string;
  email: string;
  role: UserRole;
  companyId: string;
  roleId?: string | null;
  permissions: string[];
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
    select: {
      id: true,
      email: true,
      role: true,
      companyId: true,
      isActive: true,
      roleId: true,
      customRole: {
        select: {
          permissions: true,
        },
      },
    },
  });

  if (!currentUser?.isActive) {
    return NextResponse.json(
      { success: false, error: "Session révoquée", code: "SESSION_REVOKED" },
      { status: 401 }
    );
  }

  if (requiredRole && currentUser.role !== requiredRole && currentUser.role !== "super_admin") {
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

  let effectivePermissions: string[] = [];
  if (currentUser.role === "super_admin") {
    effectivePermissions = ["*"];
  } else if (currentUser.customRole?.permissions) {
    effectivePermissions = RoleValidator.sanitizePermissions(currentUser.customRole.permissions);
  } else if (currentUser.role === "admin") {
    // Un administrateur d'entreprise sans rôle personnalisé hérite de toutes les permissions par défaut
    effectivePermissions = ["*"];
  }

  return {
    userId: currentUser.id,
    email: currentUser.email,
    role: currentUser.role,
    companyId: currentUser.companyId,
    roleId: currentUser.roleId,
    permissions: effectivePermissions,
  };
}

export async function requireTenantPermission(
  request: Request,
  requiredPermission: string
): Promise<AuthenticatedTenant | NextResponse<ApiResponse<never>>> {
  const tenant = await requireTenant(request);
  if (tenant instanceof NextResponse) return tenant;

  if (tenant.role === "super_admin" || tenant.permissions.includes("*") || tenant.permissions.includes(requiredPermission)) {
    return tenant;
  }

  return NextResponse.json(
    {
      success: false,
      error: `Permission insuffisante : '${requiredPermission}' est requise pour cette action`,
      code: "PERMISSION_DENIED",
    },
    { status: 403 }
  );
}
