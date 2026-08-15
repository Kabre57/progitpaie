/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Route API Multicompany (/api/companies) 🏢
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware-helpers";
import { CompanyRepository } from "@/lib/infrastructure";

const companyRepo = new CompanyRepository();

// GET /api/companies — Liste toutes les entités juridiques
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const companies = await companyRepo.findAll();
    return NextResponse.json({
      success: true,
      companies,
    });
  } catch (error: unknown) {
    console.error("GET /api/companies error:", error);
    return NextResponse.json(
      { success: false, error: "Échec de récupération des entreprises" },
      { status: 500 }
    );
  }
}

// POST /api/companies — Création d'une nouvelle entité juridique
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: "Le nom de l'entreprise est obligatoire" },
        { status: 400 }
      );
    }

    const newCompany = await companyRepo.create(body);

    return NextResponse.json({
      success: true,
      company: newCompany,
    });
  } catch (error: unknown) {
    console.error("POST /api/companies error:", error);
    return NextResponse.json(
      { success: false, error: "Échec de création de l'entreprise" },
      { status: 500 }
    );
  }
}
