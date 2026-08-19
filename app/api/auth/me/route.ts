import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/middleware-helpers";
import { cacheSession } from "@/lib/redis";
import { ApiResponse } from "@/types";
import { GetSessionProfileUseCase } from "@/lib/application/auth/use-cases/GetSessionProfileUseCase";
import { PrismaAuthIdentityRepository } from "@/lib/infrastructure/repositories/prisma/PrismaAuthIdentityRepository";

const getSessionProfile = new GetSessionProfileUseCase(new PrismaAuthIdentityRepository());

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Authentification requise" },
        { status: 401 }
      );
    }

    const profile = await getSessionProfile.execute(authUser.userId);
    const userData = {
      id: profile.id,
      _id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      employeeId: profile.employeeId,
      department: profile.departmentName,
      departmentId: profile.departmentId,
      leaveBalance: {
        annual: profile.leaveBalanceAnnual ?? 20,
        sick: profile.leaveBalanceSick ?? 10,
        casual: profile.leaveBalanceCasual ?? 5,
      },
      salary: profile.salary,
      sursalaire: profile.sursalaire,
      joiningDate: profile.joiningDate,
      createdAt: profile.createdAt,
      roleId: profile.roleId,
      roleName: profile.roleName,
      permissions: profile.permissions,
    };
    await cacheSession(profile.id, userData);

    return NextResponse.json<ApiResponse<unknown>>({ success: true, data: userData }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "AUTH_SESSION_USER_NOT_FOUND") {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }
    console.error("Get user error:", error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
