import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware-helpers";
import { Prisma } from "@prisma/client";

// GET /api/settings/[key] - Obtenir un groupe de paramètres
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
): Promise<Response> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { key } = await params;
    const dbSettings = await prisma.settings.findUnique({
      where: { key },
    });

    if (dbSettings) {
      return NextResponse.json({ success: true, data: dbSettings.value });
    }

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// POST /api/settings/[key] - Enregistrer / Mettre à jour un groupe de paramètres
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
): Promise<Response> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { key } = await params;
    const body = await request.json();

    const updated = await prisma.settings.upsert({
      where: { key },
      update: { value: body as Prisma.InputJsonValue },
      create: { key, value: body as Prisma.InputJsonValue },
    });

    return NextResponse.json({
      success: true,
      data: updated.value,
      message: "Parametres enregistres avec succes",
    });
  } catch (error) {
    console.error("Save settings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
