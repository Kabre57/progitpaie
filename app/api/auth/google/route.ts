import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import jwt from "jsonwebtoken";
import { getDefaultCompanyId } from "@/lib/database/tenant-context";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_progitpaie";

export async function POST(req: NextRequest) {
  try {
    const { email, name, googleId, image } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Adresse email Google requise." },
        { status: 400 }
      );
    }

    // 1. Recherche ou création automatique de l'utilisateur dans PostgreSQL
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const companyId = await getDefaultCompanyId();
      // Création automatique de l'utilisateur avec Google Auth
      user = await prisma.user.create({
        data: {
          companyId,
          email,
          name: name || email.split("@")[0],
          password: "", // Pas de mot de passe car authentification OAuth Google
          role: email.includes("admin") ? "admin" : "employee",
        },
      });
    }

    // 2. Génération du jeton JWT de session PROGITPAIE
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 3. Réponse avec Cookie HttpOnly
    const response = NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 jours
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Google Auth Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur d'authentification Google." },
      { status: 500 }
    );
  }
}
