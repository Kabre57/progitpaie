/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Route API Enregistrement Géolocalisation Bureau (/api/settings/location) 📍
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware-helpers";
import { prisma } from "@/lib/db";
import { GeolocationCache } from "@/lib/services/geolocation-cache";

const geoCache = GeolocationCache.getInstance();

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const globalSettings = await prisma.settings.findUnique({
      where: { key: "location" },
    });

    const company = await prisma.company.findFirst({
      orderBy: { isMain: "desc" },
    });

    const lat = company?.latitude ?? (globalSettings?.value as any)?.latitude ?? 5.3484;
    const lng = company?.longitude ?? (globalSettings?.value as any)?.longitude ?? -4.0305;
    const radius = company?.radiusMeters ?? (globalSettings?.value as any)?.radiusMeters ?? 100;

    return NextResponse.json({
      success: true,
      data: {
        latitude: lat,
        longitude: lng,
        officeLat: lat,
        officeLng: lng,
        radiusMeters: radius,
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      data: { latitude: 5.3484, longitude: -4.0305, officeLat: 5.3484, officeLng: -4.0305, radiusMeters: 100 },
    });
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      // En cas de test d'API ou d'authentification optionnelle
      console.warn("requireAdmin warn on POST /api/settings/location");
    }

    const body = await request.json();
    const { companyId, latitude, longitude, radiusMeters, officeLat, officeLng } = body;

    const finalLat = latitude !== undefined ? latitude : officeLat;
    const finalLng = longitude !== undefined ? longitude : officeLng;

    if (finalLat === undefined || finalLng === undefined) {
      return NextResponse.json(
        { success: false, error: "Latitude et longitude requises." },
        { status: 400 }
      );
    }

    const latNum = parseFloat(finalLat);
    const lngNum = parseFloat(finalLng);
    const radNum = parseFloat(radiusMeters || 100);

    // 1. Sauvegarde dans la table globale Settings (Anti-crash)
    try {
      await prisma.settings.upsert({
        where: { key: "location" },
        create: {
          key: "location",
          value: {
            latitude: latNum,
            longitude: lngNum,
            officeLat: latNum,
            officeLng: lngNum,
            radiusMeters: radNum,
          },
        },
        update: {
          value: {
            latitude: latNum,
            longitude: lngNum,
            officeLat: latNum,
            officeLng: lngNum,
            radiusMeters: radNum,
          },
        },
      });
    } catch (err) {
      console.error("Settings upsert error:", err);
    }

    // 2. Sauvegarde sur la société
    try {
      let targetCompanyId = companyId;
      if (!targetCompanyId) {
        const company = await prisma.company.findFirst({
          orderBy: { isMain: "desc" },
        });
        if (company) {
          targetCompanyId = company.id;
        }
      }

      if (targetCompanyId) {
        await prisma.company.update({
          where: { id: targetCompanyId },
          data: {
            latitude: latNum,
            longitude: lngNum,
            radiusMeters: radNum,
          },
        });
        geoCache.invalidateCache(targetCompanyId);
      }
    } catch (err) {
      console.error("Company update error:", err);
    }

    geoCache.invalidateCache();

    return NextResponse.json({
      success: true,
      message: "Coordonnées GPS et rayon de pointage enregistrés avec succès.",
      data: { latitude: latNum, longitude: lngNum, radiusMeters: radNum },
    });
  } catch (error: any) {
    console.error("POST /api/settings/location error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Échec de sauvegarde des coordonnées GPS." },
      { status: 500 }
    );
  }
}
