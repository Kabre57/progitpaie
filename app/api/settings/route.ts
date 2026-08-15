import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/middleware-helpers";
import { cacheSettings } from "@/lib/redis";
import {
  GetCompanySettingsUseCase,
  UpdateCompanySettingUseCase,
} from "@/lib/application/settings/use-cases/CompanySettingsUseCases";
import { PrismaCompanySettingsRepository } from "@/lib/infrastructure/repositories/prisma/PrismaCompanySettingsRepository";

const settingsRepository = new PrismaCompanySettingsRepository();
const getCompanySettings = new GetCompanySettingsUseCase(settingsRepository);
const updateCompanySetting = new UpdateCompanySettingUseCase(settingsRepository);

const settingsUpdateSchema = z.object({
  key: z.string().trim().min(1).max(100),
  value: z.json(),
});

const companyInfoSchema = z.object({
  name: z.string().trim().min(1).optional(),
  taxNumber: z.string().trim().optional(),
  cnpsNumber: z.string().trim().optional(),
  rccm: z.string().trim().optional(),
  address: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email().optional(),
}).passthrough();

const locationSchema = z.object({
  officeLat: z.number().finite().optional(),
  officeLng: z.number().finite().optional(),
  radiusMeters: z.number().finite().positive().optional(),
}).passthrough();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// GET /api/settings - Récupérer l'intégralité des paramètres réels de l'entreprise courante
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;
    if (!authResult.companyId) {
      return NextResponse.json(
        { success: false, error: "ID d'entreprise requis", code: "COMPANY_ID_REQUIRED" },
        { status: 400 }
      );
    }

    const result = await getCompanySettings.execute(authResult.companyId, authResult.userId);
    return NextResponse.json({ success: true, data: result.settings });
  } catch (error: unknown) {
    console.error("Get all settings error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des paramètres" },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Mettre à jour une clé de paramètre spécifique (Multi-tenant)
export async function PUT(request: NextRequest): Promise<Response> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;
    if (!authResult.companyId) {
      return NextResponse.json(
        { success: false, error: "ID d'entreprise requis", code: "COMPANY_ID_REQUIRED" },
        { status: 400 }
      );
    }

    const parsedInput = settingsUpdateSchema.safeParse(await request.json());
    if (!parsedInput.success) {
      return NextResponse.json(
        { success: false, error: "Paramètre invalide", details: parsedInput.error.issues },
        { status: 400 }
      );
    }

    const { key, value } = parsedInput.data;
    let companyProfile: z.infer<typeof companyInfoSchema> | undefined;
    let companyLocation: z.infer<typeof locationSchema> | undefined;

    if (key === "company_info") {
      const parsedCompanyInfo = companyInfoSchema.safeParse(value);
      if (!parsedCompanyInfo.success) {
        return NextResponse.json(
          { success: false, error: "Informations d’entreprise invalides", details: parsedCompanyInfo.error.issues },
          { status: 400 }
        );
      }
      companyProfile = parsedCompanyInfo.data;
    }

    if (key === "location") {
      const parsedLocation = locationSchema.safeParse(value);
      if (!parsedLocation.success) {
        return NextResponse.json(
          { success: false, error: "Paramètres de géolocalisation invalides", details: parsedLocation.error.issues },
          { status: 400 }
        );
      }
      companyLocation = parsedLocation.data;
    }

    const updatedValue = await updateCompanySetting.execute({
      companyId: authResult.companyId,
      key,
      value,
      companyProfile: companyProfile && {
        name: companyProfile.name,
        taxNumber: companyProfile.taxNumber,
        cnpsNumber: companyProfile.cnpsNumber,
        rccm: companyProfile.rccm,
        address: companyProfile.address,
        phone: companyProfile.phone,
        email: companyProfile.email,
      },
      companyLocation: companyLocation && {
        latitude: companyLocation.officeLat,
        longitude: companyLocation.officeLng,
        radiusMeters: companyLocation.radiusMeters,
      },
    });

    if (isRecord(value)) {
      await cacheSettings(`${authResult.companyId}:${key}`, value);
    }

    return NextResponse.json({
      success: true,
      data: updatedValue,
      message: "Paramètre enregistré avec succès en base de données",
    });
  } catch (error: unknown) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'enregistrement du paramètre" },
      { status: 500 }
    );
  }
}
