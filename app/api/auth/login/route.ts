import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { comparePassword, generateToken } from "@/lib/auth";
import { cacheSession } from "@/lib/redis";
import { validateBody } from "@/lib/validate";
import { loginSchema } from "@/lib/validators/auth.schema";
import { enforceRateLimit } from "@/lib/rate-limit";
import { AuthenticateUserUseCase } from "@/lib/application/auth/use-cases/AuthenticateUserUseCase";
import { PrismaAuthIdentityRepository } from "@/lib/infrastructure/repositories/prisma/PrismaAuthIdentityRepository";

const authenticateUser = new AuthenticateUserUseCase(new PrismaAuthIdentityRepository(), comparePassword);

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const rateLimitResponse = await enforceRateLimit(request, "login", 10, 60);
    if (rateLimitResponse) return rateLimitResponse;

    const validation = await validateBody(request, loginSchema);
    if (!validation.success) return validation.response;

    const user = await authenticateUser.execute(validation.data.email, validation.data.password);
    const token = generateToken(user.id, user.email, user.role);
    await cacheSession(user.id, { id: user.id, name: user.name, email: user.email, role: user.role });

    const cookieStore = await cookies();
    cookieStore.set("rbeas_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Connexion réussie",
        data: {
          user: {
            id: user.id,
            _id: user.id,
            name: user.name,
            role: user.role,
            mustChangePassword: user.mustChangePassword,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "AUTH_INVALID_CREDENTIALS") {
      return NextResponse.json(
        { success: false, error: "Email ou mot de passe incorrect", code: "AUTH_ERROR" },
        { status: 401 }
      );
    }
    if (error instanceof Error && error.message === "AUTH_ACCOUNT_INACTIVE") {
      return NextResponse.json(
        { success: false, error: "Le compte est inactif", code: "ACCOUNT_INACTIVE" },
        { status: 403 }
      );
    }
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
