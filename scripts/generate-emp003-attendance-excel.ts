import * as fs from "node:fs";
import * as path from "node:path";
import ExcelJS from "exceljs";

const { Workbook } = ExcelJS;

interface AttendanceExportRow {
  Matricule: string;
  "Nom & Prénoms": string;
  Date: string;
  "Heure Entree": string;
  "Heure Sortie": string;
  Statut: string;
  "Heures Supp (minutes)": number;
  "Taux Majoration": string;
  "Motif Heures Supp": string;
  Notes: string;
}

const outputDirs = [
  path.join(process.cwd(), "pointages", "EMP-003_2025_2026"),
  path.join(process.cwd(), "pointages_EMP-003_2025_2026"),
] as const;

const months = [
  { year: 2025, month: 1, name: "01_janvier_2025" },
  { year: 2025, month: 2, name: "02_fevrier_2025" },
  { year: 2025, month: 3, name: "03_mars_2025" },
  { year: 2025, month: 4, name: "04_avril_2025" },
  { year: 2025, month: 5, name: "05_mai_2025" },
  { year: 2025, month: 6, name: "06_juin_2025" },
  { year: 2025, month: 7, name: "07_juillet_2025" },
  { year: 2025, month: 8, name: "08_aout_2025" },
  { year: 2025, month: 9, name: "09_septembre_2025" },
  { year: 2025, month: 10, name: "10_octobre_2025" },
  { year: 2025, month: 11, name: "11_novembre_2025" },
  { year: 2025, month: 12, name: "12_decembre_2025" },
  { year: 2026, month: 1, name: "01_janvier_2026" },
  { year: 2026, month: 2, name: "02_fevrier_2026" },
  { year: 2026, month: 3, name: "03_mars_2026" },
  { year: 2026, month: 4, name: "04_avril_2026" },
  { year: 2026, month: 5, name: "05_mai_2026" },
  { year: 2026, month: 6, name: "06_juin_2026" },
  { year: 2026, month: 7, name: "07_juillet_2026" },
  { year: 2026, month: 8, name: "08_aout_2026" },
] as const;

function createRow(date: string, overrides: Partial<AttendanceExportRow> = {}): AttendanceExportRow {
  return {
    Matricule: "EMP-003",
    "Nom & Prénoms": "KOUAME Marc",
    Date: date,
    "Heure Entree": "08:00",
    "Heure Sortie": "17:00",
    Statut: "Présent",
    "Heures Supp (minutes)": 0,
    "Taux Majoration": "",
    "Motif Heures Supp": "",
    Notes: "Présence effectuée (8h)",
    ...overrides,
  };
}

async function generateAttendanceFiles(): Promise<void> {
  outputDirs.forEach((directory) => fs.mkdirSync(directory, { recursive: true }));
  let totalGenerated = 0;

  for (const month of months) {
    const rows: AttendanceExportRow[] = [];
    const daysInMonth = new Date(month.year, month.month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(month.year, month.month - 1, day);
      const dayOfWeek = date.getDay();
      const dateString = `${month.year}-${String(month.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      if (day === 5 && dayOfWeek !== 0) {
        rows.push(createRow(dateString, {
          "Heure Sortie": "19:00",
          "Heures Supp (minutes)": 120,
          "Taux Majoration": "15%",
          "Motif Heures Supp": "Prolongation de journée (+15%)",
          Notes: "Présence 8h + 2h Supp 15%",
        }));
      } else if (day === 12 && dayOfWeek !== 0) {
        rows.push(createRow(dateString, {
          "Heure Sortie": "20:00",
          "Heures Supp (minutes)": 180,
          "Taux Majoration": "50%",
          "Motif Heures Supp": "Travail intensif fin de projet (+50%)",
          Notes: "Présence 8h + 3h Supp 50%",
        }));
      } else if (day === 18 && dayOfWeek !== 0) {
        rows.push(createRow(dateString, {
          "Heure Sortie": "23:00",
          "Heures Supp (minutes)": 120,
          "Taux Majoration": "75% Nuit",
          "Motif Heures Supp": "Maintenance système de nuit (+75% Nuit)",
          Notes: "Présence 8h + 2h Supp Nuit 75%",
        }));
      } else if (dayOfWeek === 0 && day === 15) {
        rows.push(createRow(dateString, {
          "Heure Entree": "09:00",
          "Heure Sortie": "13:00",
          "Heures Supp (minutes)": 240,
          "Taux Majoration": "75% Dimanche",
          "Motif Heures Supp": "Permanence dominicale (+75% Dimanche)",
          Notes: "Travail dimanche jour 4h Supp 75%",
        }));
      } else if (dayOfWeek === 0 && day === 22) {
        rows.push(createRow(dateString, {
          "Heure Entree": "21:00",
          "Heure Sortie": "00:00",
          "Heures Supp (minutes)": 180,
          "Taux Majoration": "100% Nuit Férié",
          "Motif Heures Supp": "Urgence paie et assistance dimanche nuit (+100%)",
          Notes: "Intervention nuit dimanche 3h Supp 100%",
        }));
      } else if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        rows.push(createRow(dateString));
      }
    }

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Pointages", { views: [{ state: "frozen", ySplit: 1 }] });
    worksheet.columns = [
      { header: "Matricule", key: "Matricule", width: 15 },
      { header: "Nom & Prénoms", key: "Nom & Prénoms", width: 22 },
      { header: "Date", key: "Date", width: 14 },
      { header: "Heure Entree", key: "Heure Entree", width: 14 },
      { header: "Heure Sortie", key: "Heure Sortie", width: 14 },
      { header: "Statut", key: "Statut", width: 14 },
      { header: "Heures Supp (minutes)", key: "Heures Supp (minutes)", width: 22 },
      { header: "Taux Majoration", key: "Taux Majoration", width: 20 },
      { header: "Motif Heures Supp", key: "Motif Heures Supp", width: 35 },
      { header: "Notes", key: "Notes", width: 30 },
    ];
    rows.forEach((row) => worksheet.addRow(row));

    await Promise.all(outputDirs.map(async (directory) => {
      await workbook.xlsx.writeFile(path.join(directory, `pointages_EMP-003_${month.name}.xlsx`));
    }));
    totalGenerated += 1;
  }

  console.log(`✅ ${totalGenerated} fichiers Excel générés pour EMP-003 dans :`);
  outputDirs.forEach((directory) => console.log(` - ${directory}`));
}

generateAttendanceFiles().catch((error: unknown) => {
  console.error("Échec de génération des pointages EMP-003 :", error);
  process.exitCode = 1;
});
