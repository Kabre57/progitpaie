import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware-helpers";
import { Prisma } from "@prisma/client";
import { cacheSettings } from "@/lib/redis";

// GET /api/settings - Récupérer l'intégralité des paramètres réels de l'entreprise courante
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const companyId = authResult.companyId;
    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "ID d'entreprise requis", code: "COMPANY_ID_REQUIRED" },
        { status: 400 }
      );
    }

    // 1. Récupérer les paramètres spécifiques de la société dans company_settings
    const companySettings = await prisma.companySettings.findMany({
      where: { companyId },
    });

    // 2. Récupérer les données réelles de l'entreprise et de l'utilisateur administrateur
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    const user = await prisma.user.findUnique({
      where: { id: authResult.userId },
      select: { name: true, role: true },
    });

    const settingsMap: Record<string, unknown> = {};
    companySettings.forEach((item) => {
      settingsMap[item.key] = item.value;
    });

    // Mois courant en français
    const monthsFr = ["JANVIER", "FEVRIER", "MARS", "AVRIL", "MAI", "JUIN", "JUILLET", "AOUT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DECEMBRE"];
    const now = new Date();
    const currentMonth = monthsFr[now.getMonth()];
    const currentYear = now.getFullYear();
    const lastDayOfMonth = new Date(currentYear, now.getMonth() + 1, 0);
    const payDateFormatted = `${String(lastDayOfMonth.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${currentYear}`;

    // 3. Remplissage dynamique des données d'entreprise depuis la table Company si non définies
    const companyInfoFromDb = {
      name: company?.name || "",
      taxNumber: company?.taxNumber || "",
      cnpsNumber: company?.cnpsNumber || "",
      rccm: company?.rccm || "",
      address: company?.address || "",
      phone: company?.phone || "",
      email: company?.email || "",
      periodMonth: currentMonth,
      periodYear: currentYear,
      payDate: payDateFormatted,
      sigle: "",
      activity: "",
      legalForm: "SARL",
      commune: company?.city || "Abidjan",
      quartier: "",
      rue: "",
      lot: "",
      taxCenter: "",
      establishmentCode: "",
      activityCode: "",
      bankName: "",
      bankAgency: "",
      bankAccount: "",
      accountManagerCivility: "M.",
      accountManagerName: user?.name || "",
    };

    if (!settingsMap.company_info) {
      settingsMap.company_info = companyInfoFromDb;
    } else {
      settingsMap.company_info = {
        ...companyInfoFromDb,
        ...(settingsMap.company_info as Record<string, unknown>),
      };
    }

    // 4. Remplissage dynamique de la géolocalisation depuis la table Company
    if (!settingsMap.location && company) {
      settingsMap.location = {
        officeLat: company.latitude ?? 5.3484,
        officeLng: company.longitude ?? -4.0305,
        radiusMeters: company.radiusMeters ?? 150,
        strictGeofence: false,
      };
    }

    // 5. Remplissage dynamique du signataire des bulletins de paie (Nom réel de l'admin / gérant)
    const otherParamsObj = (settingsMap.other_params as Record<string, unknown>) || {};
    if (!otherParamsObj.signatoryName || otherParamsObj.signatoryName === "KOUASSI Joseph Eric") {
      otherParamsObj.signatoryName = user?.name || company?.name || "";
      otherParamsObj.signatoryRole = "Directeur Général";
      settingsMap.other_params = otherParamsObj;
    }

    return NextResponse.json({
      success: true,
      data: settingsMap,
    });
  } catch (error: any) {
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
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const companyId = authResult.companyId;
    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "ID d'entreprise requis", code: "COMPANY_ID_REQUIRED" },
        { status: 400 }
      );
    }

    const { key, value } = await request.json();

    if (!key) {
      return NextResponse.json(
        { success: false, error: "La clé de paramètre est requise" },
        { status: 400 }
      );
    }

    // 1. Sauvegarde multi-tenant dans company_settings
    const updated = await prisma.companySettings.upsert({
      where: {
        companyId_key: {
          companyId,
          key,
        },
      },
      update: { value: value as Prisma.InputJsonValue },
      create: { companyId, key, value: value as Prisma.InputJsonValue },
    });

    // 2. Synchronisation de retour vers le modèle Company principal si company_info ou location
    if (key === "company_info" && typeof value === "object" && value !== null) {
      const info = value as Record<string, any>;
      await prisma.company.update({
        where: { id: companyId },
        data: {
          name: info.name || undefined,
          taxNumber: info.taxNumber || undefined,
          cnpsNumber: info.cnpsNumber || undefined,
          rccm: info.rccm || undefined,
          address: info.address || undefined,
          phone: info.phone || undefined,
          email: info.email || undefined,
        },
      }).catch(() => null);
    }

    if (key === "location" && typeof value === "object" && value !== null) {
      const loc = value as Record<string, any>;
      await prisma.company.update({
        where: { id: companyId },
        data: {
          latitude: typeof loc.officeLat === "number" ? loc.officeLat : undefined,
          longitude: typeof loc.officeLng === "number" ? loc.officeLng : undefined,
          radiusMeters: typeof loc.radiusMeters === "number" ? loc.radiusMeters : undefined,
        },
      }).catch(() => null);
    }

    // Mettre à jour dans le cache Redis
    if (typeof value === "object" && value !== null) {
      await cacheSettings(`${authResult.companyId}:${key}`, value as Record<string, unknown>);
    }

    return NextResponse.json({
      success: true,
      data: updated.value,
      message: "Paramètre enregistré avec succès en base de données",
    });
  } catch (error: any) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'enregistrement du paramètre" },
      { status: 500 }
    );
  }
}
