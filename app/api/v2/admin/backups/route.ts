import { getErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/security/requireSuperAdmin";
import { BackupExportUseCase } from "@/lib/application/admin/use-cases/BackupExportUseCase";

const uc = new BackupExportUseCase();

/** GET /api/v2/admin/backups — List system backups */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const backups = await uc.listBackups();
    return NextResponse.json({ success: true, data: backups });
  } catch (error: unknown) {
    console.error("GET /api/v2/admin/backups error:", error);
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || "Erreur serveur" },
      { status: 500 }
    );
  }
}

/** POST /api/v2/admin/backups — Trigger a new backup */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const newBackup = await uc.createBackup();
    return NextResponse.json({ success: true, data: newBackup }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/v2/admin/backups error:", error);
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || "Échec de la sauvegarde" },
      { status: 500 }
    );
  }
}
