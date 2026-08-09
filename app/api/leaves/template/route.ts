import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireTenant } from "@/lib/database/tenant-context";
import { prisma } from "@/lib/db";

// GET /api/leaves/template - Modèle d'importation Excel des demandes de congés
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

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

    const rows = employees.length > 0
      ? employees.map((emp) => ({
          Matricule: emp.employeeId || emp.email,
          "Nom & Prénoms": emp.name,
          "Type de Congé": "Congé Payé",
          "Date de Début": todayStr,
          "Date de Fin": todayStr,
          Motif: "Congé annuel légal",
          Statut: "En attente",
        }))
      : [
          {
            Matricule: "EMP-001",
            "Nom & Prénoms": "Kouassi Jean",
            "Type de Congé": "Congé Payé",
            "Date de Début": todayStr,
            "Date de Fin": todayStr,
            Motif: "Exemple de demande",
            Statut: "En attente",
          },
        ];

    const worksheet = XLSX.utils.json_to_sheet(rows);

    worksheet["!cols"] = [
      { wch: 15 }, // Matricule
      { wch: 25 }, // Nom & Prénoms
      { wch: 22 }, // Type de Congé
      { wch: 15 }, // Date de Début
      { wch: 15 }, // Date de Fin
      { wch: 35 }, // Motif
      { wch: 15 }, // Statut
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Demandes de Congés");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="modele_importation_conges_${todayStr}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("GET /api/leaves/template error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la génération du modèle Excel" },
      { status: 500 }
    );
  }
}
