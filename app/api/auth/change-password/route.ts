import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { comparePassword, hashPassword } from "@/lib/auth";
import { requireAuth } from "@/lib/middleware-helpers";
import { validateBody } from "@/lib/validate";
import { changePasswordSchema } from "@/lib/validators/auth.schema";

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const validation = await validateBody(request, changePasswordSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { currentPassword, newPassword } = validation.data;

    const user = await prisma.user.findUnique({
      where: { id: authResult.userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Utilisateur introuvable", code: "USER_NOT_FOUND" },
        { status: 444 }
      );
    }

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Le mot de passe actuel est incorrect", code: "INVALID_CURRENT_PASSWORD" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Mot de passe modifié avec succès.",
    });
  } catch (error: any) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
