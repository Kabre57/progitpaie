import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireTenant } from "@/lib/database/tenant-context";
import { prisma } from "@/lib/db";

// GET /api/attendance/template - Génération du modèle d'importation Excel des pointages
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    // Récupération des salariés actifs du tenant pour pré-remplir le modèle Excel
    const employees = await prisma.user.findMany({
      where: {
        companyId: authResult.companyId,
        role: "employee",
      },
      select: {
        employeeId: true,
        name: true,
        email: true,
      },
      orderBy: { name: "asc" },
    });

    const todayStr = new Date().toISOString().split("T")[0];

    // Données d'exemple pré-remplies
    const rows = employees.length > 0
      ? employees.map((emp) => ({
          Matricule: emp.employeeId || emp.email,
          "Nom & Prénoms": emp.name,
          Date: todayStr,
          "Heure Entree": "08:00",
          "Heure Sortie": "17:00",
          Statut: "Présent",
          "Heures Supp (minutes)": 0,
          Notes: "Saisie normale",
        }))
      : [
          {
            Matricule: "EMP-001",
            "Nom & Prénoms": "Kouassi Jean",
            Date: todayStr,
            "Heure Entree": "08:00",
            "Heure Sortie": "17:00",
            Statut: "Présent",
            "Heures Supp (minutes)": 0,
            Notes: "Exemple",
          },
        ];

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Ajustement de la largeur des colonnes
    worksheet["!cols"] = [
      { wch: 18 }, // Matricule
      { wch: 25 }, // Nom & Prénoms
      { wch: 14 }, // Date
      { wch: 14 }, // Heure Entrée
      { wch: 14 }, // Heure Sortie
      { wch: 14 }, // Statut
      { wch: 22 }, // Heures Supp (minutes)
      { wch: 30 }, // Notes
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pointages");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="modele_pointages_progitpaie_${todayStr}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("GET /api/attendance/template error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la génération du modèle Excel" },
      { status: 500 }
    );
  }
}
