import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware-helpers";
import { getSettings, cacheSettings } from "@/lib/redis";
import { DEFAULT_SETTINGS } from "@/lib/geolocation";
import { ApiResponse, LocationSettingsBody } from "@/types";
import { Prisma } from "@prisma/client";

const SETTINGS_KEY = "location";

// GET /api/settings/location - Get current location settings
export async function GET(): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    // 1. Try Redis cache first
    const cached = await getSettings(SETTINGS_KEY);
    if (cached) {
      return NextResponse.json({ success: true, data: cached }, { status: 200 });
    }

    // 2. Fallback to Prisma database
    const dbSettings = await prisma.settings.findUnique({
      where: { key: SETTINGS_KEY },
    });

    if (dbSettings) {
      const val = dbSettings.value as Record<string, unknown>;
      await cacheSettings(SETTINGS_KEY, val);
      return NextResponse.json({ success: true, data: val }, { status: 200 });
    }

    // 3. Fallback to default constants
    await cacheSettings(SETTINGS_KEY, DEFAULT_SETTINGS);
    return NextResponse.json({ success: true, data: DEFAULT_SETTINGS }, { status: 200 });
  } catch (error) {
    console.error("Get location settings error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch settings",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

// POST /api/settings/location - Update location settings (admin only)
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body: LocationSettingsBody = await request.json();

    if (
      body.officeLat === undefined ||
      body.officeLng === undefined ||
      body.radiusMeters === undefined ||
      body.strictGeofence === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "All settings fields are required",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    if (body.officeLat < -90 || body.officeLat > 90) {
      return NextResponse.json(
        {
          success: false,
          error: "Latitude must be between -90 and 90",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    if (body.officeLng < -180 || body.officeLng > 180) {
      return NextResponse.json(
        {
          success: false,
          error: "Longitude must be between -180 and 180",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    if (body.radiusMeters < 10 || body.radiusMeters > 5000) {
      return NextResponse.json(
        {
          success: false,
          error: "Radius must be between 10 and 5000 meters",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const newSettings: Record<string, unknown> = {
      officeLat: body.officeLat,
      officeLng: body.officeLng,
      radiusMeters: body.radiusMeters,
      strictGeofence: body.strictGeofence,
    };

    // Save to Prisma Settings table
    await prisma.settings.upsert({
      where: { key: SETTINGS_KEY },
      update: { value: newSettings as Prisma.InputJsonValue },
      create: { key: SETTINGS_KEY, value: newSettings as Prisma.InputJsonValue },
    });

    // Update Redis cache
    await cacheSettings(SETTINGS_KEY, newSettings);

    return NextResponse.json(
      {
        success: true,
        data: newSettings,
        message: "Location settings updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update location settings error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update settings",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
