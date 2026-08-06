/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Route Publique v2 Employees pour ERP partenaires 🔌
 * Accès par Clé API (X-API-Key: pk_live_...) — Rate limit : 120 req/min
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticatePublicApi } from "@/lib/infrastructure/api-gateway/api-middleware";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest): Promise<Response> {
  // 1. Authentification par clé API
  const authError = await authenticatePublicApi(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const departmentId = searchParams.get("departmentId") || undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const skip = (page - 1) * limit;

    const where = {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { employeeId: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(departmentId && { departmentId }),
    };

    const [employees, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          employeeId: true,
          jobTitle: true,
          contractType: true,
          isActive: true,
          department: { select: { id: true, name: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      apiVersion: "2.0",
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      count: employees.length,
      data: employees,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Erreur serveur API v2 Employees" },
      { status: 500 }
    );
  }
}
