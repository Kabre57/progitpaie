import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { LeaveStatus, LeaveType } from "@prisma/client";
import { requireTenant } from "@/lib/database/tenant-context";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/types";

interface ImportResultData {
  imported: number;
  skipped: number;
  errors: string[];
}

function mapLeaveTypeToEnum(raw?: string): LeaveType {
  if (!raw) return LeaveType.annual;
  const str = String(raw).trim().toLowerCase();
  if (str.includes("maladie") || str === "sick") return LeaveType.sick;
  if (str.includes("permission") || str.includes("événement") || str.includes("evenement") || str === "casual") return LeaveType.casual;
  if (str.includes("sans solde") || str === "unpaid") return LeaveType.unpaid;
  return LeaveType.annual;
}

function mapLeaveStatusToEnum(raw?: string): LeaveStatus {
  if (!raw) return LeaveStatus.pending;
  const str = String(raw).trim().toLowerCase();
  if (str.includes("valid") || str.includes("approuv") || str === "approved") return LeaveStatus.approved;
  if (str.includes("rejet") || str.includes("refus") || str === "rejected") return LeaveStatus.rejected;
  return LeaveStatus.pending;
}

function parseExcelDate(val: any): string | null {
  if (!val) return null;
  if (typeof val === "number") {
    const dateObj = XLSX.SSF.parse_date_code(val);
    if (dateObj) {
      const y = dateObj.y;
      const m = String(dateObj.m).padStart(2, "0");
      const d = String(dateObj.d).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
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

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return NextResponse.json(
        { success: false, error: "Le fichier Excel est vide ou corrompu" },
        { status: 400 }
      );
    }

    const sheet = workbook.Sheets[firstSheetName];
    const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (rawRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Le fichier Excel ne contient aucune donnée" },
        { status: 400 }
      );
    }

    // Indexation des salariés par matricule et par email
    const companyEmployees = await prisma.user.findMany({
      where: { companyId: authResult.companyId },
      select: { id: true, employeeId: true, email: true },
    });

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
        const newEmp = await prisma.user.create({
          data: {
            companyId: authResult.companyId,
            employeeId: rawMatricule,
            name: rawName,
            email: `${rawMatricule.toLowerCase().replace(/[^a-z0-9]/g, "")}@progitpaie.local`,
            role: "employee",
            password: "$2a$10$UnmanagedPasswordPlaceholderHashToSatisfySchemaConstraint",
          },
        });
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

      // Création de la demande de congé dans Prisma
      await prisma.leave.create({
        data: {
          companyId: authResult.companyId,
          userId,
          leaveType,
          startDate: startDateObj,
          endDate: endDateObj,
          totalDays,
          reason: rawReason,
          status,
          approvedById: status === LeaveStatus.approved ? authResult.userId : undefined,
        },
      });

      imported++;
    }

    return NextResponse.json({
      success: true,
      data: { imported, skipped, errors },
      message: `${imported} demande(s) de congé importée(s) avec succès`,
    });
  } catch (error: any) {
    console.error("POST /api/leaves/import error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur lors de l'importation Excel des congés" },
      { status: 500 }
    );
  }
}
