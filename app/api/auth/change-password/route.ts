import { NextRequest, NextResponse } from "next/server";
import { comparePassword, hashPassword } from "@/lib/auth";
import { requireAuth } from "@/lib/middleware-helpers";
import { validateBody } from "@/lib/validate";
import { changePasswordSchema } from "@/lib/validators/auth.schema";
import { ChangePasswordUseCase } from "@/lib/application/auth/use-cases/ChangePasswordUseCase";
import { PrismaAuthIdentityRepository } from "@/lib/infrastructure/repositories/prisma/PrismaAuthIdentityRepository";

const changePassword = new ChangePasswordUseCase(new PrismaAuthIdentityRepository(), comparePassword, hashPassword);

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const validation = await validateBody(request, changePasswordSchema);
    if (!validation.success) return validation.response;

    await changePassword.execute(
      authResult.userId,
      validation.data.currentPassword,
      validation.data.newPassword
    );
    return NextResponse.json({ success: true, message: "Mot de passe modifié avec succès." });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "AUTH_USER_NOT_FOUND") {
      return NextResponse.json(
        { success: false, error: "Utilisateur introuvable", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }
    if (error instanceof Error && error.message === "AUTH_INVALID_CURRENT_PASSWORD") {
      return NextResponse.json(
        { success: false, error: "Le mot de passe actuel est incorrect", code: "INVALID_CURRENT_PASSWORD" },
        { status: 400 }
      );
    }
    console.error("Change password error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
