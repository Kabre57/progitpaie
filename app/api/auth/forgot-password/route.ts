import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { validateBody } from "@/lib/validate";
import { forgotPasswordSchema } from "@/lib/validators/auth.schema";
import { sendEmail, emailTemplates } from "@/lib/email";
import { enforceRateLimit } from "@/lib/rate-limit";
import { StartPasswordResetUseCase } from "@/lib/application/auth/use-cases/StartPasswordResetUseCase";
import { PrismaAuthIdentityRepository } from "@/lib/infrastructure/repositories/prisma/PrismaAuthIdentityRepository";

const startPasswordReset = new StartPasswordResetUseCase(new PrismaAuthIdentityRepository());
const neutralResponse = {
  success: true,
  message: "Si cette adresse email est associée à un compte actif, vous recevrez un lien de réinitialisation de mot de passe.",
};

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const rateLimitResponse = await enforceRateLimit(request, "forgot-password", 5, 60);
    if (rateLimitResponse) return rateLimitResponse;

    const validation = await validateBody(request, forgotPasswordSchema);
    if (!validation.success) return validation.response;

    const rawToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const existsAndActive = await startPasswordReset.execute(validation.data.email, rawToken, expiresAt);

    if (existsAndActive) {
      const resetUrl = `${request.nextUrl.origin}/reset-password?token=${rawToken}`;
      const template = emailTemplates.passwordReset(resetUrl);
      await sendEmail({ to: validation.data.email, subject: template.subject, html: template.html });
    }

    return NextResponse.json(neutralResponse);
  } catch (error: unknown) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
