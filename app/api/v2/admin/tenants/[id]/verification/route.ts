import { getErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/security/requireSuperAdmin";
import { ManageCompanyKybUseCase } from "@/lib/application/admin/use-cases/ManageCompanyKybUseCase";
import { VerificationStatus } from "@prisma/client";

const kybUC = new ManageCompanyKybUseCase();

/** PATCH /api/v2/admin/tenants/[id]/verification — Verify or Reject company KYB */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json();

    if (!body.status || !Object.values(VerificationStatus).includes(body.status)) {
      return NextResponse.json(
        { success: false, error: "Statut de vérification invalide (PENDING, APPROVED, REJECTED, INCOMPLETE)" },
        { status: 400 }
      );
    }

    const updated = await kybUC.verifyCompany({
      companyId: id,
      status: body.status,
      notes: body.notes,
      verifiedById: authResult.userId,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    console.error("PATCH /api/v2/admin/tenants/[id]/verification error:", error);
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || "Erreur de mise à jour" },
      { status: 500 }
    );
  }
}
