import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaSubscriptionRepository } from "@/lib/infrastructure/repositories/prisma/PrismaSubscriptionRepository";
import { GetSaaSMetricsUseCase } from "@/lib/application/admin/use-cases/GetSaaSMetricsUseCase";
import { UpdateTenantSubscriptionUseCase } from "@/lib/application/admin/use-cases/UpdateTenantSubscriptionUseCase";
import { ApiResponse } from "@/types";

const updateSubSchema = z.object({
  companyId: z.string().min(1, "L'identifiant d'entreprise est obligatoire"),
  plan: z.enum(["FREE_TRIAL", "STARTER", "BUSINESS", "ENTERPRISE"]),
  subscriptionStatus: z.enum(["TRIALING", "ACTIVE", "PAST_DUE", "CANCELED", "EXPIRED"]),
  monthlyPriceFCFA: z.number().min(0, "Le prix ne peut pas être négatif"),
  maxEmployeesAllowed: z.number().int().min(1, "Le quota doit être d'au moins 1"),
  subscriptionExpiresAt: z.string().nullable().optional(),
});

// GET /api/v2/admin/subscriptions - Métriques SaaS et liste des abonnements
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "super_admin");
    if (authResult instanceof NextResponse) return authResult;

    const subRepo = new PrismaSubscriptionRepository();
    const getMetricsUseCase = new GetSaaSMetricsUseCase(subRepo);

    const data = await getMetricsUseCase.execute();
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: unknown) {
    console.error("GET /api/v2/admin/subscriptions error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors du chargement des abonnements", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// PUT /api/v2/admin/subscriptions - Mise à jour du plan et du quota d'une entreprise
export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "super_admin");
    if (authResult instanceof NextResponse) return authResult;

    const body: unknown = await request.json();
    const parsed = updateSubSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Paramètres invalides", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const subRepo = new PrismaSubscriptionRepository();
    const updateSubUseCase = new UpdateTenantSubscriptionUseCase(subRepo);

    const updated = await updateSubUseCase.execute(parsed.data);
    return NextResponse.json({
      success: true,
      data: updated,
      message: `Abonnement mis à jour pour ${updated.name}`,
    });
  } catch (error: unknown) {
    console.error("PUT /api/v2/admin/subscriptions error:", error);
    const msg = error instanceof Error ? error.message : "Erreur lors de la mise à jour de l'abonnement";
    return NextResponse.json(
      { success: false, error: msg, code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
