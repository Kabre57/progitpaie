import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/database/tenant-context";
import { calculateGrossFromNet } from "@/lib/domain/payroll/calculator/reverse-payroll-calculator";
import { generateOfferLetterPdf } from "@/lib/infrastructure/pdf/builders/offer-letter-pdf-builder";
import { PrismaCompanySettingsRepository } from "@/lib/infrastructure/repositories/prisma/PrismaCompanySettingsRepository";

const companyRepository = new PrismaCompanySettingsRepository();
const offerLetterSchema = z.object({
  candidateName: z.string().trim().min(1).max(160),
  candidateJobTitle: z.string().trim().min(1).max(160),
  contractType: z.string().trim().min(1).max(30).default("CDI"),
  startDate: z.string().date().default(() => new Date().toISOString().slice(0, 10)),
  targetNet: z.coerce.number().finite().positive().max(100_000_000).default(500_000),
  transportAllowance: z.coerce.number().finite().nonnegative().max(10_000_000).default(30_000),
  maritalStatus: z.string().trim().min(1).max(60).default("Célibataire"),
  childrenCount: z.coerce.number().int().min(0).max(30).default(0),
  housingBenefitPercent: z.coerce.number().finite().min(0).max(100).default(0),
  vehicleBenefitPercent: z.coerce.number().finite().min(0).max(100).default(0),
});

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const parsed = offerLetterSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Données de lettre d’offre invalides", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const company = (await companyRepository.getSnapshot(authResult.companyId, authResult.userId)).company;
    const simulation = calculateGrossFromNet({
      targetNet: parsed.data.targetNet,
      transportAllowance: parsed.data.transportAllowance,
      maritalStatus: parsed.data.maritalStatus,
      childrenCount: parsed.data.childrenCount,
      housingBenefitPercent: parsed.data.housingBenefitPercent,
      vehicleBenefitPercent: parsed.data.vehicleBenefitPercent,
    });
    const pdfBuffer = generateOfferLetterPdf({
      companyName: company?.name || "PROGITPAIE S.A.",
      companyAddress: company?.address || "Abidjan, Côte d'Ivoire",
      companyPhone: company?.phone || "",
      companyEmail: company?.email || "",
      candidateName: parsed.data.candidateName,
      candidateJobTitle: parsed.data.candidateJobTitle,
      contractType: parsed.data.contractType,
      startDate: parsed.data.startDate,
      simulation,
    });
    const filenameStem = parsed.data.candidateName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "candidat";

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="lettre-offre-${filenameStem}.pdf"`,
      },
    });
  } catch (error: unknown) {
    console.error("Offer letter generation error:", error);
    return NextResponse.json(
      { success: false, error: "Échec de la génération de la lettre d'offre PDF" },
      { status: 500 }
    );
  }
}
