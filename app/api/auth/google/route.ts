import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateToken } from "@/lib/auth";
import { AuthenticateGoogleUserUseCase } from "@/lib/application/auth/use-cases/AuthenticateGoogleUserUseCase";
import { PrismaDemoSignupRepository } from "@/lib/infrastructure/repositories/prisma/PrismaDemoSignupRepository";
import { GoogleTokenInfoVerifier } from "@/lib/infrastructure/auth/GoogleTokenInfoVerifier";

const authenticateGoogleUser = new AuthenticateGoogleUserUseCase(
  new GoogleTokenInfoVerifier(),
  new PrismaDemoSignupRepository()
);
const googleLoginSchema = z.object({ idToken: z.string().trim().min(100).max(20_000) });

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const parsed = googleLoginSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Jeton d’identité Google requis." },
        { status: 400 }
      );
    }

    const result = await authenticateGoogleUser.execute(parsed.data.idToken);
    const token = generateToken(result.user.id, result.user.email, result.user.role);
    const response = NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          isDemo: result.isDemo,
          demoExpiresAt: result.demoExpiresAt,
        },
      },
    });
    response.cookies.set("rbeas_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });
    return response;
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "AUTH_ACCOUNT_INACTIVE") {
      return NextResponse.json(
        { success: false, error: "Le compte est inactif.", code: "ACCOUNT_INACTIVE" },
        { status: 403 }
      );
    }
    if (error instanceof Error && error.message === "GOOGLE_CLIENT_ID_NOT_CONFIGURED") {
      return NextResponse.json(
        { success: false, error: "La connexion Google n’est pas configurée.", code: "OAUTH_NOT_CONFIGURED" },
        { status: 503 }
      );
    }
    if (error instanceof Error && error.message === "GOOGLE_ID_TOKEN_INVALID") {
      return NextResponse.json(
        { success: false, error: "Le jeton Google est invalide ou expiré.", code: "OAUTH_INVALID_TOKEN" },
        { status: 401 }
      );
    }
    console.error("Google Auth Error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur d'authentification Google." },
      { status: 500 }
    );
  }
}
