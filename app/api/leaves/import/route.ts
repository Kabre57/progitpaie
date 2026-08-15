import { NextRequest, NextResponse } from "next/server";
import { excelSerialDateToIso, readFirstWorksheetRecords } from "@/lib/infrastructure/excel/exceljs-reader";
import { requireTenant } from "@/lib/database/tenant-context";
import type { ImportedLeaveStatus, ImportedLeaveType } from "@/lib/application/leave/ports/LeaveImportRepository";
import { PrismaLeaveImportRepository } from "@/lib/infrastructure/repositories/prisma/PrismaLeaveImportRepository";
import { ApiResponse } from "@/types";

interface ImportResultData {
  imported: number;
  skipped: number;
  errors: string[];
}

const leaveImportRepository = new PrismaLeaveImportRepository();

function mapLeaveTypeToEnum(raw?: unknown): ImportedLeaveType {
  if (!raw) return "annual";
  const str = String(raw).trim().toLowerCase();
  if (str.includes("maladie") || str === "sick") return "sick";
  if (str.includes("permission") || str.includes("événement") || str.includes("evenement") || str === "casual") return "casual";
  if (str.includes("sans solde") || str === "unpaid") return "unpaid";
  return "annual";
}

function mapLeaveStatusToEnum(raw?: unknown): ImportedLeaveStatus {
  if (!raw) return "pending";
  const str = String(raw).trim().toLowerCase();
  if (str.includes("valid") || str.includes("approuv") || str === "approved") return "approved";
  if (str.includes("rejet") || str.includes("refus") || str === "rejected") return "rejected";
  return "pending";
}

function parseExcelDate(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === "number") {
    return excelSerialDateToIso(val);
  }
  if (val instanceof Date) {
    return val.toISOString().split("T")[0];
  }
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const frMatch = str.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (frMatch) {
    const [, d, m, y] = frMatch;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  return null;
}

function calculateWorkingDays(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 1;

  let days = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const dayOfWeek = cur.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      days++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return Math.max(days, 1);
}

// POST /api/leaves/import - Importation des demandes de congés via fichier Excel (.xlsx / .xls)
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<ImportResultData>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Aucun fichier fourni dans la requête" },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      return NextResponse.json(
        { success: false, error: "Format non pris en charge : utilisez un fichier .xlsx" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const rawRows = await readFirstWorksheetRecords(Buffer.from(arrayBuffer));

    if (rawRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Le fichier Excel ne contient aucune donnée" },
        { status: 400 }
      );
    }

    // Indexation des salariés par matricule et par email
    const companyEmployees = await leaveImportRepository.listEmployees(authResult.companyId);

    const empMap = new Map<string, string>();
    companyEmployees.forEach((emp) => {
      if (emp.employeeId) empMap.set(emp.employeeId.trim().toLowerCase(), emp.id);
      if (emp.email) empMap.set(emp.email.trim().toLowerCase(), emp.id);
    });

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const lineNum = i + 2;

      const rawMatricule = String(row["Matricule"] || row["matricule"] || row["Email"] || row["email"] || "").trim();
      const rawType = row["Type de Congé"] || row["Type"] || row["leaveType"];
      const rawStart = row["Date de Début"] || row["Date Début"] || row["startDate"];
      const rawEnd = row["Date de Fin"] || row["Date Fin"] || row["endDate"];
      const rawReason = String(row["Motif"] || row["reason"] || "Demande importée via Excel").trim();
      const rawStatus = row["Statut"] || row["status"];

      if (!rawMatricule) {
        skipped++;
        errors.push(`Ligne ${lineNum} ignorée : Matricule ou email manquant`);
        continue;
      }

      let userId = empMap.get(rawMatricule.toLowerCase());
      if (!userId) {
        // Auto-création du salarié s'il n'existe pas encore
        const rawName = String(row["Nom & Prénoms"] || row["Nom"] || row["name"] || `Salarié ${rawMatricule}`).trim();
        const newEmp = await leaveImportRepository.createEmployee(
          authResult.companyId,
          rawMatricule,
          rawName
        );
        userId = newEmp.id;
        empMap.set(rawMatricule.toLowerCase(), userId);
      }

      const startDateStr = parseExcelDate(rawStart);
      const endDateStr = parseExcelDate(rawEnd);

      if (!startDateStr || !endDateStr) {
        skipped++;
        errors.push(`Ligne ${lineNum} ignorée : Dates invalides (Début: ${rawStart}, Fin: ${rawEnd})`);
        continue;
      }

      const leaveType = mapLeaveTypeToEnum(rawType);
      const status = mapLeaveStatusToEnum(rawStatus);
      const totalDays = calculateWorkingDays(startDateStr, endDateStr);

      const startDateObj = new Date(`${startDateStr}T00:00:00.000Z`);
      const endDateObj = new Date(`${endDateStr}T23:59:59.999Z`);

      await leaveImportRepository.createLeave({
        companyId: authResult.companyId,
        userId,
        leaveType,
        startDate: startDateObj,
        endDate: endDateObj,
        totalDays,
        reason: rawReason,
        status,
        approvedById: status === "approved" ? authResult.userId : undefined,
      });

      imported++;
    }

    return NextResponse.json({
      success: true,
      data: { imported, skipped, errors },
      message: `${imported} demande(s) de congé importée(s) avec succès`,
    });
  } catch (error: unknown) {
    console.error("POST /api/leaves/import error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur lors de l'importation Excel des congés" },
      { status: 500 }
    );
  }
}
