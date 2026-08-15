import { NextRequest, NextResponse } from "next/server";
import { Workbook } from "exceljs";
import { requireTenant } from "@/lib/database/tenant-context";
import { EmployeeRepository } from "@/lib/infrastructure/repositories/employee-repository";

const employeeRepo = new EmployeeRepository();

interface AttendanceTemplateRow {
  Matricule: string;
  "Nom & Prénoms": string;
  Date: string;
  "Heure Entree": string;
  "Heure Sortie": string;
  Statut: string;
  "Heures Supp (minutes)": number;
  Notes: string;
}

// GET /api/attendance/template - Génération du modèle d'importation Excel des pointages
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const employees = await employeeRepo.findAllActive(authResult.companyId);
    const todayStr = new Date().toISOString().split("T")[0];

    const rows: AttendanceTemplateRow[] = employees.length > 0
      ? employees.map((employee) => ({
          Matricule: employee.employeeId || employee.id,
          "Nom & Prénoms": employee.name,
          Date: todayStr,
          "Heure Entree": "08:00",
          "Heure Sortie": "17:00",
          Statut: "Présent",
          "Heures Supp (minutes)": 0,
          Notes: "Saisie normale",
        }))
      : [{
          Matricule: "EMP-001",
          "Nom & Prénoms": "Kouassi Jean",
          Date: todayStr,
          "Heure Entree": "08:00",
          "Heure Sortie": "17:00",
          Statut: "Présent",
          "Heures Supp (minutes)": 0,
          Notes: "Exemple",
        }];

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Pointages");
    worksheet.columns = [
      { header: "Matricule", key: "Matricule", width: 18 },
      { header: "Nom & Prénoms", key: "Nom & Prénoms", width: 25 },
      { header: "Date", key: "Date", width: 14 },
      { header: "Heure Entree", key: "Heure Entree", width: 14 },
      { header: "Heure Sortie", key: "Heure Sortie", width: 14 },
      { header: "Statut", key: "Statut", width: 14 },
      { header: "Heures Supp (minutes)", key: "Heures Supp (minutes)", width: 22 },
      { header: "Notes", key: "Notes", width: 30 },
    ];
    worksheet.addRows(rows);

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="modele_pointages_progitpaie_${todayStr}.xlsx"`,
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/attendance/template error:", error);
    const message = error instanceof Error ? error.message : "Erreur lors de la génération du modèle Excel";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
