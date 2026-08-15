import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/middleware-helpers";
import { GeolocationCache } from "@/lib/services/geolocation-cache";
import {
  GetCompanySettingsUseCase,
  UpdateCompanySettingUseCase,
} from "@/lib/application/settings/use-cases/CompanySettingsUseCases";
import { PrismaCompanySettingsRepository } from "@/lib/infrastructure/repositories/prisma/PrismaCompanySettingsRepository";

const geoCache = GeolocationCache.getInstance();
const repository = new PrismaCompanySettingsRepository();
const getCompanySettings = new GetCompanySettingsUseCase(repository);
const updateCompanySetting = new UpdateCompanySettingUseCase(repository);

const locationSchema = z.object({
  latitude: z.coerce.number().finite().optional(),
  longitude: z.coerce.number().finite().optional(),
  officeLat: z.coerce.number().finite().optional(),
  officeLng: z.coerce.number().finite().optional(),
  radiusMeters: z.coerce.number().finite().positive().optional(),
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function numberOrFallback(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;
    if (!authResult.companyId) {
      return NextResponse.json({ success: false, error: "ID d'entreprise requis" }, { status: 400 });
    }

    const result = await getCompanySettings.execute(authResult.companyId, authResult.userId);
    const location = isRecord(result.settings.location) ? result.settings.location : {};
    const latitude = numberOrFallback(location.officeLat ?? location.latitude, 5.3484);
    const longitude = numberOrFallback(location.officeLng ?? location.longitude, -4.0305);
    const radiusMeters = numberOrFallback(location.radiusMeters, 100);

    return NextResponse.json({
      success: true,
      data: { latitude, longitude, officeLat: latitude, officeLng: longitude, radiusMeters },
    });
  } catch (error: unknown) {
    console.error("GET /api/settings/location error:", error);
    return NextResponse.json(
      { success: false, error: "Impossible de récupérer les coordonnées GPS" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;
    if (!authResult.companyId) {
      return NextResponse.json({ success: false, error: "ID d'entreprise requis" }, { status: 400 });
    }

    const parsed = locationSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Coordonnées GPS invalides", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const latitude = parsed.data.latitude ?? parsed.data.officeLat;
    const longitude = parsed.data.longitude ?? parsed.data.officeLng;
    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { success: false, error: "Latitude et longitude requises." },
        { status: 400 }
      );
    }
    const radiusMeters = parsed.data.radiusMeters ?? 100;
    const value = {
      latitude,
      longitude,
      officeLat: latitude,
      officeLng: longitude,
      radiusMeters,
    };

    await updateCompanySetting.execute({
      companyId: authResult.companyId,
      key: "location",
      value,
      companyLocation: { latitude, longitude, radiusMeters },
    });
    geoCache.invalidateCache(authResult.companyId);

    return NextResponse.json({
      success: true,
      message: "Coordonnées GPS et rayon de pointage enregistrés avec succès.",
      data: { latitude, longitude, radiusMeters },
    });
  } catch (error: unknown) {
    console.error("POST /api/settings/location error:", error);
    const message = error instanceof Error ? error.message : "Échec de sauvegarde des coordonnées GPS.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
