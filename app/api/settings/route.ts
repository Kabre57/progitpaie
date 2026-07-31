import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware-helpers";
import { Prisma } from "@prisma/client";
import { cacheSettings, getSettings } from "@/lib/redis";

// GET /api/settings - Récupérer l'intégralité des paramètres réels depuis la base de données
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const allSettings = await prisma.settings.findMany();
    
    const settingsMap: Record<string, unknown> = {};
    allSettings.forEach((item) => {
      settingsMap[item.key] = item.value;
    });

    return NextResponse.json({
      success: true,
      data: settingsMap,
    });
  } catch (error) {
    console.error("Get all settings error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des paramètres" },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Mettre à jour une clé de paramètre spécifique
export async function PUT(request: NextRequest): Promise<Response> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { key, value } = await request.json();

    if (!key) {
      return NextResponse.json(
        { success: false, error: "La clé de paramètre est requise" },
        { status: 400 }
      );
    }

    const updated = await prisma.settings.upsert({
      where: { key },
      update: { value: value as Prisma.InputJsonValue },
      create: { key, value: value as Prisma.InputJsonValue },
    });

    // Mettre à jour dans le cache Redis
    if (typeof value === "object" && value !== null) {
      await cacheSettings(key, value as Record<string, unknown>);
    }

    return NextResponse.json({
      success: true,
      data: updated.value,
      message: "Paramètre enregistré avec succès en base de données",
    });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'enregistrement du paramètre" },
      { status: 500 }
    );
  }
}
