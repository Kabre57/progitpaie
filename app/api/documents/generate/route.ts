import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware-helpers";
import { generateContractHTML } from "@/lib/templates/documents/contract-templates";
import { generateWorkAttestationHTML } from "@/lib/templates/documents/attestation-templates";
import { generateSeveranceHTML } from "@/lib/templates/documents/severance-templates";

export async function POST(req: NextRequest) {
  try {
    // Vérification des droits administrateur
    const authResult = await requireAdmin(req);
    if ("status" in authResult && authResult.status !== 200) {
      return authResult;
    }

    const body = await req.json();
    const { documentType, employeeId, companyId, customFields } = body;

    if (!documentType || !employeeId) {
      return NextResponse.json(
        { success: false, error: "documentType et employeeId sont requis." },
        { status: 400 }
      );
    }

    // Récupération des données du salarié et de la société
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      include: { company: true, department: true },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Salarié introuvable." },
        { status: 404 }
      );
    }

    const companyName = employee.company?.name || "PROGITPAIE S.A.";
    const companyAddress = employee.company?.address || "Abidjan, Côte d'Ivoire";

    let htmlContent = "";

    switch (documentType.toUpperCase()) {
      case "CONTRACT_CDI":
      case "CONTRACT_CDD":
        htmlContent = generateContractHTML({
          companyName,
          companyAddress,
          employeeName: employee.name,
          employeeAddress: employee.address || "Abidjan",
          employeeNationality: employee.nationality || "Ivoirienne",
          jobTitle: (employee as any).position || employee.role || "Salarié",
          contractType: documentType.includes("CDD") ? "CDD" : "CDI",
          startDate: (employee as any).hireDate ? new Date((employee as any).hireDate).toLocaleDateString("fr-FR") : new Date().toLocaleDateString("fr-FR"),
          baseSalary: (employee as any).baseSalary || 200000,
          transportAllowance: customFields?.transportAllowance || 30000,
          housingAllowance: customFields?.housingAllowance || 0,
        });
        break;

      case "WORK_ATTESTATION":
        htmlContent = generateWorkAttestationHTML({
          companyName,
          companyAddress,
          employeeName: employee.name,
          jobTitle: (employee as any).position || employee.role || "Salarié",
          startDate: (employee as any).hireDate ? new Date((employee as any).hireDate).toLocaleDateString("fr-FR") : new Date().toLocaleDateString("fr-FR"),
        });
        break;

      case "SEVERANCE_STC":
        htmlContent = generateSeveranceHTML({
          companyName,
          employeeName: employee.name,
          jobTitle: (employee as any).position || employee.role || "Salarié",
          leaveBalanceAmount: customFields?.leaveBalanceAmount || 150000,
          noticeAllowance: customFields?.noticeAllowance || 200000,
          severancePay: customFields?.severancePay || 350000,
          totalAmount: (customFields?.leaveBalanceAmount || 150000) + (customFields?.noticeAllowance || 200000) + (customFields?.severancePay || 350000),
        });
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Type de document non supporté: ${documentType}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: {
        documentType,
        htmlContent,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Document Generation Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur interne lors de la génération." },
      { status: 500 }
    );
  }
}
