import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/security/requireSuperAdmin";
import { GlobalSettingsUseCase } from "@/lib/application/admin/use-cases/GlobalSettingsUseCase";
import { z } from "zod";

const settingsUC = new GlobalSettingsUseCase();

const ResetSectionSchema = z.object({
  section: z.enum(["cnpsRates", "leavePolicy", "securityPolicy"]),
});

/** POST /api/v2/admin/settings/global/reset — Reset a section to defaults */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const parsed = ResetSectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Section invalide. Valeurs autorisées : cnpsRates, leavePolicy, securityPolicy" },
        { status: 400 }
      );
    }

    const updated = await settingsUC.reset(parsed.data.section);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("POST /api/v2/admin/settings/global/reset error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Échec de la réinitialisation" },
      { status: 500 }
    );
  }
}
