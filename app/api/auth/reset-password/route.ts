import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { validateBody } from "@/lib/validate";
import { resetPasswordSchema } from "@/lib/validators/auth.schema";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await enforceRateLimit(request, "reset-password", 5, 60);
    if (rateLimitResponse) return rateLimitResponse;

    const validation = await validateBody(request, resetPasswordSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { token, newPassword } = validation.data;

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Le jeton de réinitialisation est invalide ou expiré.", code: "INVALID_TOKEN" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
