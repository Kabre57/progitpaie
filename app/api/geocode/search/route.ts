/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Route API Géocodage d'Adresse OpenStreetMap / Nominatim (📍)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware-helpers";

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
      const revData = await revRes.json();
      return NextResponse.json({
        success: true,
        address: revData.display_name || "Adresse inconnue",
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

    const results = await searchRes.json();

    const formattedResults = results.map((item: any) => ({
      name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));

    return NextResponse.json({
      success: true,
      results: formattedResults,
    });
  } catch (error: any) {
    console.error("Geocoding API error:", error);
    return NextResponse.json(
      { success: false, error: "Échec du géocodage d'adresse." },
      { status: 500 }
    );
  }
}
