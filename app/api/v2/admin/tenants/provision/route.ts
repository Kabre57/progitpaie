import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaProvisionTenantRepository } from "@/lib/infrastructure/repositories/prisma/PrismaProvisionTenantRepository";
import { ProvisionTenantWithTemplateUseCase } from "@/lib/application/admin/use-cases/ProvisionTenantWithTemplateUseCase";
import { hashPassword } from "@/lib/auth";
import { ApiResponse } from "@/types";

// Schéma de validation Zod pour la création d'entreprise
const provisionSchema = z.object({
  name: z.string().min(2, "Le nom doit comporter au moins 2 caractères"),
  taxNumber: z.string().optional(),
  cnpsNumber: z.string().optional(),
  rccm: z.string().optional(),
  address: z.string().optional(),
  city: z.string().default("Abidjan"),
  phone: z.string().optional(),
  email: z.string().optional(),
  adminName: z.string().min(2, "Le nom de l'administrateur est requis"),
  adminEmail: z.string().email("L'adresse email est invalide"),
  adminPassword: z.string().min(8, "Le mot de passe administrateur est obligatoire (8 caractères minimum)"),
  plan: z.enum(["FREE_TRIAL", "STARTER", "BUSINESS", "ENTERPRISE"]).default("STARTER"),
});

// POST /api/v2/admin/tenants/provision - Création et provisioning d'une nouvelle entreprise cliente
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "super_admin");
    if (authResult instanceof NextResponse) return authResult;

    const body: unknown = await request.json();
    const parsed = provisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Données invalides", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const provisionRepo = new PrismaProvisionTenantRepository();
    const provisionUseCase = new ProvisionTenantWithTemplateUseCase(provisionRepo, hashPassword);

    const result = await provisionUseCase.execute(parsed.data);

    return NextResponse.json({
      success: true,
      data: result,
      message: `Entreprise "${result.company.name}" créée et configurée avec succès !`,
    }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/v2/admin/tenants/provision error:", error);
    const msg = error instanceof Error ? error.message : "Erreur lors du provisioning de l'entreprise";
    return NextResponse.json(
      { success: false, error: msg, code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
