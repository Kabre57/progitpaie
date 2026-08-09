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
  importedMonth?: string;
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

// POST /api/attendance/import - Importation des pointages & heures supp via fichier Excel (.xlsx / .xls)
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
    let importedMonth: string | undefined = undefined;
    const errors: string[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const lineNum = i + 2;

      const rawMatricule = String(row["Matricule"] || row["matricule"] || row["Email"] || row["email"] || "").trim();
      const rawDate = row["Date"] || row["date"];
      const rawStatus = row["Statut"] || row["statut"] || row["Status"] || row["status"];
      const rawCheckIn = String(row["Heure Entree"] || row["Heure Entrée"] || row["checkIn"] || "08:00").trim();
      const rawCheckOut = String(row["Heure Sortie"] || row["checkOut"] || "17:00").trim();
      const rawOvertime = Number(row["Heures Supp (minutes)"] || row["overtimeMinutes"] || row["Heures Supp"] || 0);
      const rawRateStr = String(row["Taux Majoration"] || row["Taux"] || row["rate"] || "").trim();
      const rawNotes = String(row["Notes"] || row["notes"] || "").trim();

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

      const dateStr = parseExcelDate(rawDate);
      if (!dateStr) {
        skipped++;
        errors.push(`Ligne ${lineNum} ignorée : Date invalide "${rawDate}" pour ${rawMatricule}`);
        continue;
      }

      if (!importedMonth && dateStr.length >= 7) {
        importedMonth = dateStr.slice(0, 7); // e.g. "2025-01"
      }

      const status = mapStatusToEnum(rawStatus);
      const checkInDate = new Date(`${dateStr}T${rawCheckIn.includes(":") ? rawCheckIn : "08:00"}:00.000Z`);
      const checkOutDate = rawCheckOut && rawCheckOut.includes(":") ? new Date(`${dateStr}T${rawCheckOut}:00.000Z`) : null;

      // Calcul des heures travaillées
      let workingMinutes = 0;
      let hoursWorked = 0;

      if (checkInDate && checkOutDate) {
        const diffMs = checkOutDate.getTime() - checkInDate.getTime();
        const elapsedMinutes = Math.floor(diffMs / (1000 * 60));
        if (elapsedMinutes >= 540) {
          workingMinutes = 480; // 8 heures effectives (pause déjeuner de 1h déduite)
          hoursWorked = 8.0;
        } else if (elapsedMinutes > 0) {
          workingMinutes = Math.min(elapsedMinutes, 480);
          hoursWorked = Math.round((workingMinutes / 60) * 10) / 10;
        }
      } else if (status === AttendanceStatus.present || status === AttendanceStatus.late) {
        workingMinutes = 480;
        hoursWorked = 8.0;
      } else if (status === AttendanceStatus.half_day) {
        workingMinutes = 240;
        hoursWorked = 4.0;
      }

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
          hoursWorked,
          workingMinutes,
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
          hoursWorked,
          workingMinutes,
          overtimeMinutes: isNaN(rawOvertime) ? 0 : rawOvertime,
          notes: rawNotes || undefined,
        },
      });

      // Traitement des Heures Supplémentaires (+15%, +50%, +75%, +100%)
      if (rawOvertime > 0) {
        let rate = 1.15;
        if (rawRateStr.includes("100") || rawRateStr.includes("2.0")) rate = 2.0;
        else if (rawRateStr.includes("75") || rawRateStr.includes("1.75")) rate = 1.75;
        else if (rawRateStr.includes("50") || rawRateStr.includes("1.5")) rate = 1.5;
        else if (rawRateStr.includes("15") || rawRateStr.includes("1.15")) rate = 1.15;

        const reason = String(row["Motif Heures Supp"] || row["Motif"] || rawNotes || "Heures supplémentaires importées").trim();
        const overtimeDate = new Date(`${dateStr}T00:00:00.000Z`);

        const existingOvertime = await prisma.overtime.findFirst({
          where: {
            companyId: authResult.companyId,
            userId,
            date: overtimeDate,
          },
        });

        if (existingOvertime) {
          await prisma.overtime.update({
            where: { id: existingOvertime.id },
            data: {
              minutes: rawOvertime,
              rate,
              reason,
            },
          });
        } else {
          await prisma.overtime.create({
            data: {
              companyId: authResult.companyId,
              userId,
              date: overtimeDate,
              minutes: rawOvertime,
              rate,
              reason,
              status: "pending",
            },
          });
        }
      }

      imported++;
    }

    return NextResponse.json({
      success: true,
      data: { imported, skipped, errors, importedMonth },
      message: `${imported} pointage(s) & heure(s) supp importé(s) avec succès`,
    });
  } catch (error: any) {
    console.error("POST /api/attendance/import error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur lors de l'importation Excel" },
      { status: 500 }
    );
  }
}
