import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { AttendanceStatus } from "@prisma/client";
import { requireTenant } from "@/lib/database/tenant-context";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/types";

interface ImportResultData {
  imported: number;
  skipped: number;
  errors: string[];
}

function mapStatusToEnum(rawStatus?: string): AttendanceStatus {
  if (!rawStatus) return AttendanceStatus.present;
  const normalized = String(rawStatus).trim().toLowerCase();
  if (normalized.includes("absent")) return AttendanceStatus.absent;
  if (normalized.includes("retard") || normalized === "late") return AttendanceStatus.late;
  if (normalized.includes("demi") || normalized.includes("half")) return AttendanceStatus.half_day;
  if (normalized.includes("cong") || normalized.includes("leave")) return AttendanceStatus.on_leave;
  return AttendanceStatus.present;
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

// POST /api/attendance/import - Importation des pointages via fichier Excel (.xlsx / .xls)
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

    // Indexation des salariés de l'entreprise par matricule et par email
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
      const rawDate = row["Date"] || row["date"];
      const rawStatus = row["Statut"] || row["statut"] || row["Status"] || row["status"];
      const rawCheckIn = String(row["Heure Entree"] || row["Heure Entrée"] || row["checkIn"] || "08:00").trim();
      const rawCheckOut = String(row["Heure Sortie"] || row["checkOut"] || "").trim();
      const rawOvertime = Number(row["Heures Supp (minutes)"] || row["overtimeMinutes"] || 0);
      const rawNotes = String(row["Notes"] || row["notes"] || "").trim();

      if (!rawMatricule) {
        skipped++;
        errors.push(`Ligne ${lineNum} ignorée : Matricule ou email manquant`);
        continue;
      }

      const userId = empMap.get(rawMatricule.toLowerCase());
      if (!userId) {
        skipped++;
        errors.push(`Ligne ${lineNum} ignorée : Salarié non trouvé avec le matricule "${rawMatricule}"`);
        continue;
      }

      const dateStr = parseExcelDate(rawDate);
      if (!dateStr) {
        skipped++;
        errors.push(`Ligne ${lineNum} ignorée : Date invalide "${rawDate}" pour ${rawMatricule}`);
        continue;
      }

      const status = mapStatusToEnum(rawStatus);
      const checkInDate = new Date(`${dateStr}T${rawCheckIn.includes(":") ? rawCheckIn : "08:00"}:00.000Z`);
      const checkOutDate = rawCheckOut && rawCheckOut.includes(":") ? new Date(`${dateStr}T${rawCheckOut}:00.000Z`) : null;

      // Upsert du pointage dans Prisma
      await prisma.attendance.upsert({
        where: {
          userId_date: {
            userId,
            date: dateStr,
          },
        },
        update: {
          status,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          overtimeMinutes: isNaN(rawOvertime) ? 0 : rawOvertime,
          notes: rawNotes || undefined,
        },
        create: {
          companyId: authResult.companyId,
          userId,
          date: dateStr,
          status,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          overtimeMinutes: isNaN(rawOvertime) ? 0 : rawOvertime,
          notes: rawNotes || undefined,
        },
      });

      imported++;
    }

    return NextResponse.json({
      success: true,
      data: { imported, skipped, errors },
      message: `${imported} pointage(s) importé(s) avec succès`,
    });
  } catch (error: any) {
    console.error("POST /api/attendance/import error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur lors de l'importation Excel" },
      { status: 500 }
    );
  }
}
