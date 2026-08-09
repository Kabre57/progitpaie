import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/middleware-helpers";
import { getSession, cacheSession } from "@/lib/redis";
import { ApiResponse } from "@/types";

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Authentification requise",
        },
        { status: 401 }
      );
    }

    // Requête directe en base de données pour garantir les données complètes
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        employeeId: true,
        departmentId: true,
        department: { select: { id: true, name: true } },
        leaveBalanceAnnual: true,
        leaveBalanceSick: true,
        leaveBalanceCasual: true,
        salary: true,
        sursalaire: true,
        joiningDate: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Utilisateur non trouvé",
        },
        { status: 404 }
      );
    }

    const userData = {
      id: user.id,
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId || null,
      department: user.department?.name || null,
      departmentId: user.departmentId,
      leaveBalance: {
        annual: user.leaveBalanceAnnual ?? 20,
        sick: user.leaveBalanceSick ?? 10,
        casual: user.leaveBalanceCasual ?? 5,
      },
      salary: user.salary,
      sursalaire: user.sursalaire,
      joiningDate: user.joiningDate,
      createdAt: user.createdAt,
    };

    // Mettre à jour la session dans Redis
    await cacheSession(user.id, userData);

    return NextResponse.json<ApiResponse<unknown>>(
      {
        success: true,
        data: userData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: "Erreur interne du serveur",
      },
      { status: 500 }
    );
  }
}
