import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/middleware-helpers";
import { AttendanceStatus } from "@prisma/client";
import { ApiResponse } from "@/types";
import { validateBody } from "@/lib/validate";
import { checkInSchema, CheckInInput } from "@/lib/validators/attendance.schema";
import { acquireLock, releaseLock } from "@/lib/lock";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) {
      return user;
    }

    // 1. Acquérir un verrou distribué Redis pour éviter les doubles pointages en simultané
    const lockKey = `checkin:${user.userId}`;
    const lockToken = await acquireLock(lockKey, 5000);

    if (!lockToken) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Un pointage est déjà en cours de traitement. Veuillez patienter.",
          code: "CONCURRENCY_LOCK",
        },
        { status: 429 }
      );
    }

    try {
      // 2. Validation Zod du corps de la requête
      const validation = await validateBody(request, checkInSchema);
      const payload: CheckInInput = validation.success ? validation.data : { outOfOffice: false };

      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];

      // 3. Auto-checkout des sessions oubliées de plus de 12 heures
      const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
      const danglingRecord = await prisma.attendance.findFirst({
        where: {
          userId: user.userId,
          checkOut: null,
          checkIn: { lt: twelveHoursAgo },
        },
      });

      if (danglingRecord) {
        const autoCheckOutTime = new Date(danglingRecord.checkIn.getTime() + 12 * 60 * 60 * 1000);
        const finalCheckOut = autoCheckOutTime > now ? now : autoCheckOutTime;
        const updatedNotes = danglingRecord.notes
          ? `${danglingRecord.notes} | Auto-checkout après 12h`
          : "Auto-checkout après 12h";

        await prisma.attendance.update({
          where: { id: danglingRecord.id },
          data: {
            checkOut: finalCheckOut,
            workingMinutes: 12 * 60,
            hoursWorked: 12,
            notes: updatedNotes,
          },
        });
      }

      // 4. Vérifier si l'employé a déjà pointé aujourd'hui
      const existingRecord = await prisma.attendance.findUnique({
        where: {
          userId_date: {
            userId: user.userId,
            date: todayStr,
          },
        },
      });

      if (existingRecord) {
        return NextResponse.json<ApiResponse<never>>(
          {
            success: false,
            error: "Vous avez déjà effectué votre pointage pour aujourd'hui.",
            code: "ALREADY_CHECKED_IN",
          },
          { status: 400 }
        );
      }

      // 5. Récupération des infos du Shift et calcul des retards
      let isLate = false;
      const userDoc = await prisma.user.findUnique({
        where: { id: user.userId },
        include: { shift: true },
      });

      if (userDoc?.shift?.startTime) {
        const [shiftHour, shiftMinute] = userDoc.shift.startTime.split(":").map(Number);
        const checkInHour = now.getHours();
        const checkInMinute = now.getMinutes();

        const shiftStartMinutes = shiftHour * 60 + shiftMinute;
        const checkInMinutes = checkInHour * 60 + checkInMinute;
        const minutesLate = checkInMinutes - shiftStartMinutes;

        isLate = minutesLate > (userDoc.shift.lateThresholdMinutes || 15);
      }

      const status: AttendanceStatus = isLate ? AttendanceStatus.late : AttendanceStatus.present;

      // 6. Enregistrement du pointage
      const attendance = await prisma.attendance.create({
        data: {
          userId: user.userId,
          date: todayStr,
          checkIn: now,
          status,
          notes: payload.notes || "",
          locationLat: payload.location?.lat ?? null,
          locationLng: payload.location?.lng ?? null,
          outOfOffice: payload.outOfOffice || false,
        },
      });

      return NextResponse.json<ApiResponse<unknown>>(
        {
          success: true,
          message: isLate ? "Pointage enregistré (En retard)" : "Pointage réussi",
          data: {
            id: attendance.id,
            _id: attendance.id,
            date: attendance.date,
            checkIn: attendance.checkIn,
            status: attendance.status,
            isLate,
          },
        },
        { status: 201 }
      );
    } finally {
      await releaseLock(lockKey, lockToken);
    }
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: "Erreur interne du serveur lors du pointage",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
