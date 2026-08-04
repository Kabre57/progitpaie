import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/database/tenant-context";
import { Prisma } from "@prisma/client";
import { ApiResponse } from "@/types";

// Helper to create audit log entry
async function createAuditLog(
  performedBy: string,
  action: string,
  targetModel: string,
  targetId: string,
  oldValues?: Record<string, unknown>,
  newValues?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    const actor = await prisma.user.findUnique({
      where: { id: performedBy },
      select: { companyId: true },
    });
    if (!actor) throw new Error("Auteur du journal d'audit introuvable");
    await prisma.auditLog.create({
      data: {
        companyId: actor.companyId,
        performedById: performedBy,
        action,
        targetModel,
        targetId,
        oldValues: oldValues ? (oldValues as Prisma.InputJsonValue) : Prisma.JsonNull,
        newValues: newValues ? (newValues as Prisma.InputJsonValue) : Prisma.JsonNull,
        ipAddress,
        userAgent,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error("Create audit log error:", error);
  }
}

// GET /api/audit-logs - Get all audit logs (admin only)
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const targetModel = searchParams.get("targetModel");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const where: Prisma.AuditLogWhereInput = { companyId: authResult.companyId };
    if (action) where.action = action;
    if (targetModel) where.targetModel = targetModel;

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip,
        take: limit,
        include: {
          performedBy: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    const formattedLogs = logs.map((l) => ({
      ...l,
      _id: l.id,
      performedBy: {
        ...l.performedBy,
        _id: l.performedBy.id,
      },
    }));

    return NextResponse.json(
      {
        success: true,
        data: formattedLogs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get audit logs error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch audit logs",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
