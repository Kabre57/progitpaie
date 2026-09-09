import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaSuperAdminTeamRepository } from "@/lib/infrastructure/repositories/prisma/PrismaSuperAdminTeamRepository";
import { ManageSuperAdminTeamUseCase } from "@/lib/application/admin/use-cases/ManageSuperAdminTeamUseCase";
import { hashPassword } from "@/lib/auth";
import { ApiResponse } from "@/types";

const createMemberSchema = z.object({
  name: z.string().min(2, "Le nom doit comporter au moins 2 caractères"),
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(12, "Le mot de passe doit comporter au moins 12 caractères"),
});

// GET /api/v2/admin/team - Liste des membres Super Admin
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "super_admin");
    if (authResult instanceof NextResponse) return authResult;

    const teamRepo = new PrismaSuperAdminTeamRepository();
    const teamUseCase = new ManageSuperAdminTeamUseCase(teamRepo, hashPassword);

    const members = await teamUseCase.listMembers();
    return NextResponse.json({ success: true, data: members }, { status: 200 });
  } catch (error: unknown) {
    console.error("GET /api/v2/admin/team error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des membres de l'équipe", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// POST /api/v2/admin/team - Ajouter / Inviter un nouveau Super Admin
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "super_admin");
    if (authResult instanceof NextResponse) return authResult;

    const body: unknown = await request.json();
    const parsed = createMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Données invalides", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const teamRepo = new PrismaSuperAdminTeamRepository();
    const teamUseCase = new ManageSuperAdminTeamUseCase(teamRepo, hashPassword);

    const created = await teamUseCase.inviteMember(parsed.data);
    return NextResponse.json({
      success: true,
      data: created,
      message: `Super Admin ${created.name} créé avec succès`,
    }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/v2/admin/team error:", error);
    const msg = error instanceof Error ? error.message : "Erreur lors de l'ajout du Super Admin";
    return NextResponse.json(
      { success: false, error: msg, code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
