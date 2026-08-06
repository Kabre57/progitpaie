import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/security/requireSuperAdmin";
import { ManageSubscriptionUseCase } from "@/lib/application/admin/use-cases/ManageSubscriptionUseCase";
import { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

const subUC = new ManageSubscriptionUseCase();

/** PATCH /api/v2/admin/tenants/[id]/subscription — Update subscription plan and pricing */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json();

    if (body.plan && !Object.values(SubscriptionPlan).includes(body.plan)) {
      return NextResponse.json(
        { success: false, error: "Plan d'abonnement invalide" },
        { status: 400 }
      );
    }

    if (body.subscriptionStatus && !Object.values(SubscriptionStatus).includes(body.subscriptionStatus)) {
      return NextResponse.json(
        { success: false, error: "Statut d'abonnement invalide" },
        { status: 400 }
      );
    }

    const updated = await subUC.updateSubscription(
      {
        companyId: id,
        plan: body.plan,
        subscriptionStatus: body.subscriptionStatus,
        subscriptionExpiresAt: body.subscriptionExpiresAt,
        monthlyPriceFCFA: body.monthlyPriceFCFA !== undefined ? parseFloat(body.monthlyPriceFCFA) : undefined,
        maxEmployeesAllowed: body.maxEmployeesAllowed !== undefined ? parseInt(body.maxEmployeesAllowed, 10) : undefined,
      },
      authResult.userId
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PATCH /api/v2/admin/tenants/[id]/subscription error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur de mise à jour de l'abonnement" },
      { status: 500 }
    );
  }
}
