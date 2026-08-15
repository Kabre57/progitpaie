import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/middleware-helpers";
import { SettingsRepository } from "@/lib/infrastructure/repositories/settings-repository";
import {
  GetGlobalSettingUseCase,
  SaveGlobalSettingUseCase,
} from "@/lib/application/settings/use-cases/GlobalSettingUseCase";

const repository = new SettingsRepository();
const getGlobalSetting = new GetGlobalSettingUseCase(repository);
const saveGlobalSetting = new SaveGlobalSettingUseCase(repository);
const keySchema = z.string().trim().min(1).max(100);
const valueSchema = z.json();

// GET /api/settings/[key] - Obtenir un groupe de paramètres
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
): Promise<Response> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const parsedKey = keySchema.safeParse((await params).key);
    if (!parsedKey.success) {
      return NextResponse.json({ success: false, error: "Clé de paramètre invalide" }, { status: 400 });
    }

    const value = await getGlobalSetting.execute(parsedKey.data);
    return NextResponse.json({ success: true, data: value });
  } catch (error: unknown) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération du paramètre" },
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
    if (authResult instanceof NextResponse) return authResult;

    const parsedKey = keySchema.safeParse((await params).key);
    const parsedValue = valueSchema.safeParse(await request.json());
    if (!parsedKey.success || !parsedValue.success) {
      return NextResponse.json({ success: false, error: "Paramètre invalide" }, { status: 400 });
    }

    const value = await saveGlobalSetting.execute(parsedKey.data, parsedValue.data);
    return NextResponse.json({
      success: true,
      data: value,
      message: "Paramètres enregistrés avec succès",
    });
  } catch (error: unknown) {
    console.error("Save settings error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'enregistrement du paramètre" },
      { status: 500 }
    );
  }
}
