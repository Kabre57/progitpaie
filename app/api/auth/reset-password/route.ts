import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { validateBody } from "@/lib/validate";
import { resetPasswordSchema } from "@/lib/validators/auth.schema";
import { enforceRateLimit } from "@/lib/rate-limit";
import { ResetPasswordUseCase } from "@/lib/application/auth/use-cases/ResetPasswordUseCase";
import { PrismaAuthIdentityRepository } from "@/lib/infrastructure/repositories/prisma/PrismaAuthIdentityRepository";

const resetPassword = new ResetPasswordUseCase(new PrismaAuthIdentityRepository(), hashPassword);

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const rateLimitResponse = await enforceRateLimit(request, "reset-password", 5, 60);
    if (rateLimitResponse) return rateLimitResponse;

    const validation = await validateBody(request, resetPasswordSchema);
    if (!validation.success) return validation.response;

    await resetPassword.execute(validation.data.token, validation.data.newPassword);
    return NextResponse.json({
      success: true,
      message: "Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.",
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "AUTH_RESET_TOKEN_INVALID") {
      return NextResponse.json(
        { success: false, error: "Le jeton de réinitialisation est invalide ou expiré.", code: "INVALID_TOKEN" },
        { status: 400 }
      );
    }
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
