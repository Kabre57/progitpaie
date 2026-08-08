import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { forgotPasswordSchema } from "@/lib/validators/auth.schema";
import { sendEmail, emailTemplates } from "@/lib/email";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await enforceRateLimit(request, "forgot-password", 5, 60);
    if (rateLimitResponse) return rateLimitResponse;

    const validation = await validateBody(request, forgotPasswordSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { email } = validation.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user && user.isActive) {
      // Génération d'un jeton aléatoire de 32 octets (hex = 64 caractères)
      const rawToken = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000); // Expiration dans 1h

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: rawToken,
          resetPasswordExpires: expires,
        },
      });

      const resetUrl = `${request.nextUrl.origin}/reset-password?token=${rawToken}`;
      const template = emailTemplates.passwordReset(resetUrl);

      await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
      });
    }

    // Réponse neutre pour des raisons de sécurité
    return NextResponse.json({
      success: true,
      message: "Si cette adresse email est associée à un compte actif, vous recevrez un lien de réinitialisation de mot de passe.",
    });
  } catch (error: unknown) {
    console.error("Forgot password error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json(
      { success: false, error: errorMessage, code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
