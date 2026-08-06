import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/database/tenant-context";
import { validateBody } from "@/lib/validate";
import { documentGenerationSchema, type DocumentGenerationInput } from "@/shared/validation/document.schema";
import type { DocumentType } from "@/shared/types/contracts/document.contract";
import { generateContractHTML } from "@/lib/templates/documents/contract-templates";
import { generateWorkAttestationHTML } from "@/lib/templates/documents/attestation-templates";
import { generateSeveranceHTML } from "@/lib/templates/documents/severance-templates";
import { PDFDocumentFactory } from "@/lib/infrastructure/pdf/pdf-document-factory";
import { ContractPDFBuilder } from "@/lib/infrastructure/pdf/builders/contract-pdf-builder";

type EmployeeDocumentRecord = Prisma.UserGetPayload<{
  include: { company: true; department: true };
}>;

function jsonObject(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function textPdf(title: string, body: string): Buffer {
  const document = new jsPDF();
  document.setFont("helvetica", "bold");
  document.setFontSize(16);
  document.text(title, 105, 20, { align: "center" });
  document.setFont("helvetica", "normal");
  document.setFontSize(10);
  const lines = document.splitTextToSize(body, 180) as string[];
  document.text(lines, 15, 35);
  return Buffer.from(document.output("arraybuffer"));
}

function employeeHtml(input: DocumentGenerationInput, employee: EmployeeDocumentRecord): { title: string; html: string } {
  const companyName = employee.company?.name ?? "PROGITPAIE";
  const companyAddress = employee.company?.address ?? "Abidjan, Côte d'Ivoire";
  const name = input.customName ?? employee.name;
  const jobTitle = input.customJobTitle ?? employee.jobTitle ?? "Salarié";
  const startDate = input.startDate ?? employee.joiningDate.toLocaleDateString("fr-FR");

  if (input.docType === "contract") {
    return {
      title: "Contrat de travail",
      html: input.customBodyText ?? generateContractHTML({
        companyName, companyAddress, employeeName: name,
        employeeAddress: employee.address ?? "Abidjan",
        employeeNationality: employee.nationality ?? "Ivoirienne",
        jobTitle, contractType: employee.contractType ?? "CDI", startDate,
        endDate: input.endDate,
        baseSalary: input.customSalary ?? employee.salary,
        transportAllowance: employee.transportAllowance,
        housingAllowance: employee.housingAllowance,
      }),
    };
  }

  if (["attestation", "certificat", "attestation_conge"].includes(input.docType)) {
    return {
      title: input.docType === "attestation_conge" ? "Attestation de congé" : "Attestation de travail",
      html: input.customBodyText ?? generateWorkAttestationHTML({
        companyName, companyAddress, employeeName: name, jobTitle, startDate,
        leaveStartDate: input.startDate, leaveEndDate: input.endDate,
      }),
    };
  }

  return {
    title: "Solde de tout compte",
    html: input.customBodyText ?? generateSeveranceHTML({
      companyName, employeeName: name, jobTitle,
      leaveBalanceAmount: 0, noticeAllowance: 0, severancePay: 0, totalAmount: 0,
    }),
  };
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const tenant = await requireTenant(request, "admin");
    if (tenant instanceof NextResponse) return tenant;

    const validation = await validateBody(request, documentGenerationSchema);
    if (!validation.success) return validation.response;
    const input = validation.data;
    const targetUserId = input.userId ?? input.employeeId;

    const company = await prisma.company.findUnique({ where: { id: tenant.companyId } });
    if (!company) {
      return NextResponse.json({ success: false, error: "Société introuvable" }, { status: 404 });
    }

    let pdf: Buffer;
    const declarationTypes: Partial<Record<DocumentType, string>> = {
      declaration_its: "declaration_its", its: "declaration_its",
      declaration_cnps: "declaration_cnps", cnps: "declaration_cnps",
      declaration_fdfp: "declaration_fdfp", fdfp: "declaration_fdfp",
      rns: "rns",
    };
    const declarationType = declarationTypes[input.docType];

    if (declarationType && input.docType !== "rns") {
      pdf = PDFDocumentFactory.createDocument({
        docType: declarationType,
        month: input.month ?? 1,
        year: input.year ?? new Date().getFullYear(),
        companyName: company.name,
        companyAddress: company.address ?? "",
        taxNumber: company.taxNumber ?? "",
        cnpsNumber: company.cnpsNumber ?? "",
        itsData: jsonObject(input.itsData),
        cnpsData: jsonObject(input.cnpsData),
        fdfpData: jsonObject(input.fdfpData),
      });
    } else if (["payslip", "bulletin"].includes(input.docType)) {
      const payroll = await prisma.payroll.findFirst({
        where: { userId: targetUserId, month: input.month, year: input.year, user: { companyId: tenant.companyId } },
        include: { user: true },
      });
      if (!payroll) return NextResponse.json({ success: false, error: "Bulletin introuvable" }, { status: 404 });
      pdf = textPdf("BULLETIN DE PAIE", `${payroll.user.name} - ${input.month}/${input.year}\nSalaire brut: ${payroll.grossSalary} FCFA\nRetenues: ${payroll.totalDeductions} FCFA\nNet à payer: ${payroll.netSalary} FCFA`);
    } else if (input.docType === "ordre_virement") {
      pdf = textPdf("ORDRE DE VIREMENT", `Banque: ${input.bankName ?? "Non renseignée"}\nPériode: ${input.month}/${input.year}\nMontant total: ${input.totalAmount ?? 0} FCFA`);
    } else if (input.docType === "rns") {
      const employee = await prisma.user.findFirst({ where: { id: targetUserId, companyId: tenant.companyId } });
      if (!employee) return NextResponse.json({ success: false, error: "Salarié introuvable" }, { status: 404 });
      pdf = textPdf("RELEVÉ NOMINATIF DES SALAIRES", `${input.customName ?? employee.name}\n${JSON.stringify(input.rnsData ?? [], null, 2)}`);
    } else if (input.docType === "contract") {
      const employee = await prisma.user.findFirst({
        where: { id: targetUserId, companyId: tenant.companyId },
        include: { company: true, department: true },
      });
      if (!employee) return NextResponse.json({ success: false, error: "Salarié introuvable" }, { status: 404 });

      pdf = ContractPDFBuilder.generatePDF({
        companyName: input.companyName || company.name,
        companyAddress: input.companyAddress || company.address || "Abidjan, Côte d'Ivoire",
        companyRepresentative: input.companyRepresentative || "la Direction Générale",
        employeeName: input.customName || employee.name,
        employeeBirth: input.employeeBirth || "01/01/2000 à Abidjan",
        employeeNationality: input.employeeNationality || employee.nationality || "Ivoirienne",
        employeeCni: input.employeeCni || "Non renseigné",
        employeeAddress: input.employeeAddress || employee.address || "Abidjan",
        jobTitle: input.customJobTitle || employee.jobTitle || "Comptable",
        contractType: employee.contractType || "CDI",
        startDate: input.startDate || employee.joiningDate.toLocaleDateString("fr-FR"),
        endDate: input.endDate,
        articles: input.articles || [
          { title: "Article 1er", content: `${input.customName || employee.name} est engagé(e) au poste de ${input.customJobTitle || employee.jobTitle || "Salarié"}, conformément à la Convention Collective Interprofessionnelle (CCI).` },
          { title: "Article 2", content: "Le présent contrat prend fin sur décision unilatérale de l'une ou l'autre des parties au contrat, conformément au Code du Travail." },
          { title: "Article 3", content: `Le salarié percevra un salaire de base de ${(input.customSalary || employee.salary).toLocaleString()} FCFA.` },
        ],
      });
    } else {
      const employee = await prisma.user.findFirst({
        where: { id: targetUserId, companyId: tenant.companyId },
        include: { company: true, department: true },
      });
      if (!employee) return NextResponse.json({ success: false, error: "Salarié introuvable" }, { status: 404 });
      const document = employeeHtml(input, employee);
      pdf = textPdf(document.title.toUpperCase(), htmlToText(document.html));
    }

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${input.docType}-${Date.now()}.pdf"`,
        "Cache-Control": "no-store, private",
      },
    });
  } catch (error: unknown) {
    console.error("Document Generation Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erreur interne lors de la génération" },
      { status: 500 }
    );
  }
}
