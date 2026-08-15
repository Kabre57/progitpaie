import { getErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/security/requireSuperAdmin";
import { GlobalSettingsUseCase } from "@/lib/application/admin/use-cases/GlobalSettingsUseCase";
import { UpdateGlobalSettingsSchema } from "@/shared/validation/global-settings.schema";

const settingsUC = new GlobalSettingsUseCase();

/** GET /api/v2/admin/settings/global — Read all global settings */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const settings = await settingsUC.get();
    return NextResponse.json({ success: true, data: settings });
  } catch (error: unknown) {
    console.error("GET /api/v2/admin/settings/global error:", error);
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || "Erreur serveur" },
      { status: 500 }
    );
  }
}

/** PUT /api/v2/admin/settings/global — Update one or more sections */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const parsed = UpdateGlobalSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    if (!parsed.data.cnpsRates && !parsed.data.leavePolicy && !parsed.data.securityPolicy) {
      return NextResponse.json(
        { success: false, error: "Au moins une section doit être fournie (cnpsRates, leavePolicy ou securityPolicy)" },
        { status: 400 }
      );
    }

    const updated = await settingsUC.update(parsed.data);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    console.error("PUT /api/v2/admin/settings/global error:", error);
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || "Échec de la mise à jour" },
      { status: 500 }
    );
  }
}
