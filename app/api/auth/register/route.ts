import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { CreateDemoAccountUseCase } from "@/lib/application/auth/use-cases/CreateDemoAccountUseCase";
import { PrismaDemoSignupRepository } from "@/lib/infrastructure/repositories/prisma/PrismaDemoSignupRepository";

const createDemoAccount = new CreateDemoAccountUseCase(new PrismaDemoSignupRepository());
const registerSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(320),
  password: z.string().min(8).max(128),
  department: z.string().trim().min(1).max(120).optional(),
  companyName: z.string().trim().min(1).max(180),
});

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const rateLimitResponse = await enforceRateLimit(request, "register", 5, 60);
    if (rateLimitResponse) return rateLimitResponse;

    const parsed = registerSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Le nom de l’entreprise, le nom, l’adresse email et un mot de passe d’au moins 8 caractères sont obligatoires", code: "VALIDATION_ERROR", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const demoExpiresAt = new Date();
    demoExpiresAt.setDate(demoExpiresAt.getDate() + 14);
    const account = await createDemoAccount.execute({
      companyName: parsed.data.companyName,
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      passwordHash: await hashPassword(parsed.data.password),
      departmentName: parsed.data.department,
      expiresAt: demoExpiresAt,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Compte Démo créé avec succès",
        data: {
          user: {
            id: account.user.id,
            _id: account.user.id,
            name: account.user.name,
            role: account.user.role,
            companyId: account.user.companyId,
            isDemo: true,
            demoExpiresAt: account.demoExpiresAt,
          },
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "AUTH_EMAIL_ALREADY_REGISTERED") {
      return NextResponse.json(
        { success: false, error: "Cette adresse email est déjà associée à un compte.", code: "EMAIL_ALREADY_REGISTERED" },
        { status: 409 }
      );
    }
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur inattendue lors de l’inscription", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
