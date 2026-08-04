import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/database/tenant-context";
import { AttendanceStatus } from "@prisma/client";
import { ApiResponse } from "@/types";
import { acquireLock, releaseLock } from "@/lib/lock";
import { GeolocationCache } from "@/lib/services/geolocation-cache";
import { verifyGeofenceFence } from "@/lib/utils/distance-calculator";
import { validateBody } from "@/lib/validate";
import { checkInSchema } from "@/lib/validators/attendance.schema";

const geoCache = GeolocationCache.getInstance();

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUserId = authResult.userId;

    const lockKey = `checkin:${currentUserId}`;
    const lockToken = await acquireLock(lockKey, 5000).catch(() => "bypass-lock");

    try {
      const validation = await validateBody(request, checkInSchema);
      if (!validation.success) return validation.response;
      const { latitude, longitude, accuracyMeters = 15, isRemote = false } = validation.data;

      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];

      // Récupération de l'employé
      const employee = await prisma.user.findFirst({
        where: { id: currentUserId, companyId: authResult.companyId },
      });

      if (!employee) {
        return NextResponse.json(
          { success: false, error: "Employé introuvable en base." },
          { status: 404 }
        );
      }

      const empWorkType = employee.workType || "ONSITE";
      const isTelework = empWorkType === "REMOTE" || isRemote;

      let geofenceResult = {
        isWithinFence: true,
        distanceMeters: 0,
        accuracyMeters: accuracyMeters || 15,
        message: "Pointage enregistré.",
      };

      if (!isTelework) {
        if (latitude === undefined || longitude === undefined) {
          return NextResponse.json(
            {
              success: false,
              error: "La géolocalisation GPS est obligatoire pour pointer sur site. Veuillez autoriser le GPS.",
              code: "GPS_REQUIRED",
            },
            { status: 400 }
          );
        }

        const officeGPS = await geoCache.getCompanyGPS(employee.companyId);

        geofenceResult = verifyGeofenceFence({
          userLat: latitude,
          userLng: longitude,
          accuracyMeters,
          officeLat: officeGPS.latitude,
          officeLng: officeGPS.longitude,
          radiusMeters: officeGPS.radiusMeters,
        });

        if (!geofenceResult.isWithinFence) {
          return NextResponse.json(
            {
              success: false,
              error: geofenceResult.message,
              code: "OUT_OF_BOUNDS",
              details: {
                distanceMeters: geofenceResult.distanceMeters,
                radiusMeters: officeGPS.radiusMeters,
                canRequestException: true,
              },
            },
            { status: 403 }
          );
        }
      }

      // Auto-checkout des sessions de plus de 12h
      const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
      const danglingRecord = await prisma.attendance.findFirst({
        where: {
          userId: currentUserId,
          checkOut: null,
          checkIn: { lt: twelveHoursAgo },
        },
      });

      if (danglingRecord) {
        await prisma.attendance.update({
          where: { id: danglingRecord.id },
          data: {
            checkOut: new Date(danglingRecord.checkIn.getTime() + 12 * 60 * 60 * 1000),
            notes: danglingRecord.notes ? `${danglingRecord.notes} | Auto-checkout` : "Auto-checkout",
          },
        });
      }

      // Vérification doublon aujourd'hui
      const existingToday = await prisma.attendance.findUnique({
        where: { userId_date: { userId: currentUserId, date: todayStr } },
      });

      if (existingToday) {
        return NextResponse.json(
          {
            success: false,
            error: "Vous avez déjà pointé votre arrivée pour aujourd'hui.",
            code: "ALREADY_CHECKED_IN",
          },
          { status: 400 }
        );
      }

      // Détermination du retard (8h30)
      const workStartTime = new Date(now);
      workStartTime.setHours(8, 30, 0, 0);
      const status: AttendanceStatus = now > workStartTime ? "late" : "present";

      const attendance = await prisma.attendance.create({
        data: {
          companyId: authResult.companyId,
          userId: currentUserId,
          date: todayStr,
          checkIn: now,
          status,
          locationLat: latitude ?? null,
          locationLng: longitude ?? null,
          accuracyMeters,
          distanceMeters: geofenceResult.distanceMeters,
          isWithinFence: geofenceResult.isWithinFence,
          notes: isTelework ? "Pointage Télétravail / Remote" : "Pointage sur site",
        },
      });

      return NextResponse.json({
        success: true,
        data: attendance,
        message: isTelework ? "Pointage en télétravail validé !" : geofenceResult.message,
      });
    } finally {
      if (lockToken && lockToken !== "bypass-lock") {
        await releaseLock(lockKey, lockToken).catch(() => {});
      }
    }
  } catch (error: unknown) {
    console.error("POST /api/attendance/check-in error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Échec du pointage d'arrivée.",
      },
      { status: 500 }
    );
  }
}
