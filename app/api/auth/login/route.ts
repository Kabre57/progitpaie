import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { comparePassword, generateToken } from "@/lib/auth";
import { cacheSession } from "@/lib/redis";
import { validateBody } from "@/lib/validate";
import { loginSchema } from "@/lib/validators/auth.schema";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await enforceRateLimit(request, "login", 10, 60);
    if (rateLimitResponse) return rateLimitResponse;

    // Validation centralisée Zod du corps de la requête
    const validation = await validateBody(request, loginSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { email, password } = validation.data;

    // Chercher l'utilisateur par email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Email ou mot de passe incorrect", code: "AUTH_ERROR" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: "Le compte est inactif", code: "ACCOUNT_INACTIVE" },
        { status: 403 }
      );
    }

    // Vérifier le mot de passe
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Email ou mot de passe incorrect", code: "AUTH_ERROR" },
        { status: 401 }
      );
    }

    // Générer le token JWT
    const token = generateToken(user.id, user.email, user.role);

    // Mettre en cache la session utilisateur dans Redis
    await cacheSession(user.id, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    // Définir le cookie HTTP-only
    const cookieStore = await cookies();
    cookieStore.set("rbeas_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: "/",
    });

    // Retourner les données utilisateur (sans le mot de passe)
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
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur interne du serveur", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
