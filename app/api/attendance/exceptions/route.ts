/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Route Admin Exceptions Pointage (/api/attendance/exceptions) 📍
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware-helpers";
import { prisma } from "@/lib/db";

// GET /api/attendance/exceptions — Liste toutes les demandes d'exceptions en attente ou traitées
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const exceptions = await prisma.attendance.findMany({
      where: {
        exceptionStatus: { not: null },
      },
      include: {
        user: {
          select: { id: true, name: true, employeeId: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      exceptions,
    });
  } catch (error: any) {
    console.error("GET /api/attendance/exceptions error:", error);
    return NextResponse.json(
      { success: false, error: "Échec de récupération des exceptions." },
      { status: 500 }
    );
  }
}

// POST /api/attendance/exceptions — Valide (APPROVED) ou Rejette (REJECTED) une exception
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const adminUser = (authResult as any).user || { id: "admin" };
    const body = await request.json();
    const { attendanceId, action } = body; // action: 'APPROVED' | 'REJECTED'

    if (!attendanceId || !["APPROVED", "REJECTED"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Identifiant et action valide requis." },
        { status: 400 }
      );
    }

    const updated = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        exceptionStatus: action,
        overriddenById: adminUser.id,
        overriddenAt: new Date(),
        notes: action === "APPROVED" ? "Exception validée par la Direction RH." : "Exception refusée.",
      },
    });

    return NextResponse.json({
      success: true,
      message: `La demande d'exception a été ${action === "APPROVED" ? "approuvée" : "rejetée"}.`,
      attendance: updated,
    });
  } catch (error: any) {
    console.error("POST /api/attendance/exceptions error:", error);
    return NextResponse.json(
      { success: false, error: "Échec de traitement de l'exception." },
      { status: 500 }
    );
  }
}
