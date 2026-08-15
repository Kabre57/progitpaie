/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Route API Géocodage d'Adresse OpenStreetMap / Nominatim (📍)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware-helpers";

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function toFiniteCoordinate(value: unknown): number | null {
  const coordinate = typeof value === "string" || typeof value === "number"
    ? Number.parseFloat(String(value))
    : Number.NaN;
  return Number.isFinite(coordinate) ? coordinate : null;
}

// GET /api/geocode/search?q=Abidjan Plateau
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    // Reverse Geocoding (Lat/Lng -> Adresse textuelle)
    if (lat && lng) {
      const revRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            "User-Agent": "Progitpaie-Geofencing/1.0",
          },
        }
      );
      const revData: unknown = await revRes.json();
      const address = toRecord(revData).display_name;
      return NextResponse.json({
        success: true,
        address: typeof address === "string" ? address : "Adresse inconnue",
      });
    }

    // Forward Geocoding (Texte -> Lat/Lng)
    if (!query) {
      return NextResponse.json({ success: false, error: "Veuillez fournir une adresse." }, { status: 400 });
    }

    const searchRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
      {
        headers: {
          "User-Agent": "Progitpaie-Geofencing/1.0",
        },
      }
    );

    const results: unknown = await searchRes.json();
    const resultItems: unknown[] = Array.isArray(results) ? results : [];

    const formattedResults = resultItems
      .map((item) => {
        const result = toRecord(item);
        const latValue = toFiniteCoordinate(result.lat);
        const lngValue = toFiniteCoordinate(result.lon);
        const name = result.display_name;
        return typeof name === "string" && latValue !== null && lngValue !== null
          ? { name, lat: latValue, lng: lngValue }
          : null;
      })
      .filter((item): item is { name: string; lat: number; lng: number } => item !== null);

    return NextResponse.json({
      success: true,
      results: formattedResults,
    });
  } catch (error: unknown) {
    console.error("Geocoding API error:", error);
    return NextResponse.json(
      { success: false, error: "Échec du géocodage d'adresse." },
      { status: 500 }
    );
  }
}
