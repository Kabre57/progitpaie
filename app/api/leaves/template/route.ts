import { NextRequest, NextResponse } from "next/server";
import { Workbook } from "exceljs";
import { requireTenant } from "@/lib/database/tenant-context";
import { EmployeeRepository } from "@/lib/infrastructure/repositories/employee-repository";

const employeeRepo = new EmployeeRepository();

interface LeaveTemplateRow {
  Matricule: string;
  "Nom & Prénoms": string;
  "Type de Congé": string;
  "Date de Début": string;
  "Date de Fin": string;
  Motif: string;
  Statut: string;
}

// GET /api/leaves/template - Modèle d'importation Excel des demandes de congés
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const employees = await employeeRepo.findAllActive(authResult.companyId);
    const todayStr = new Date().toISOString().split("T")[0];

    const rows: LeaveTemplateRow[] = employees.length > 0
      ? employees.map((employee) => ({
          Matricule: employee.employeeId || employee.id,
          "Nom & Prénoms": employee.name,
          "Type de Congé": "Congé Payé",
          "Date de Début": todayStr,
          "Date de Fin": todayStr,
          Motif: "Congé annuel légal",
          Statut: "En attente",
        }))
      : [{
          Matricule: "EMP-001",
          "Nom & Prénoms": "Kouassi Jean",
          "Type de Congé": "Congé Payé",
          "Date de Début": todayStr,
          "Date de Fin": todayStr,
          Motif: "Exemple de demande",
          Statut: "En attente",
        }];

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Demandes de Congés");
    worksheet.columns = [
      { header: "Matricule", key: "Matricule", width: 15 },
      { header: "Nom & Prénoms", key: "Nom & Prénoms", width: 25 },
      { header: "Type de Congé", key: "Type de Congé", width: 22 },
      { header: "Date de Début", key: "Date de Début", width: 15 },
      { header: "Date de Fin", key: "Date de Fin", width: 15 },
      { header: "Motif", key: "Motif", width: 35 },
      { header: "Statut", key: "Statut", width: 15 },
    ];
    worksheet.addRows(rows);

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="modele_importation_conges_${todayStr}.xlsx"`,
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/leaves/template error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la génération du modèle Excel" },
      { status: 500 }
    );
  }
}
