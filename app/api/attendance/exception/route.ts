/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Route API Demande d'Exception Pointage (/api/attendance/exception) 📍
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/middleware-helpers";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { exceptionType, exceptionReason, latitude, longitude } = body;

    if (!exceptionType || !exceptionReason) {
      return NextResponse.json(
        { success: false, error: "Le type et la justification de la demande sont requis." },
        { status: 400 }
      );
    }

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // Création ou mise à jour de la présence en statut d'exception PENDING
    const attendance = await prisma.attendance.upsert({
      where: { userId_date: { userId: authResult.userId, date: todayStr } },
      create: {
        userId: authResult.userId,
        date: todayStr,
        checkIn: now,
        status: "present",
        isWithinFence: false,
        locationLat: latitude ? parseFloat(latitude) : null,
        locationLng: longitude ? parseFloat(longitude) : null,
        exceptionStatus: "PENDING",
        exceptionType,
        exceptionReason,
        notes: `Demande d'exception (${exceptionType}) en attente de validation RH.`,
      },
      update: {
        exceptionStatus: "PENDING",
        exceptionType,
        exceptionReason,
        notes: `Demande d'exception (${exceptionType}) réémise.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Votre demande d'exception a été soumise avec succès au service RH.",
      attendance,
    });
  } catch (error: any) {
    console.error("POST /api/attendance/exception error:", error);
    return NextResponse.json(
      { success: false, error: "Échec de soumission de la demande d'exception." },
      { status: 500 }
    );
  }
}
