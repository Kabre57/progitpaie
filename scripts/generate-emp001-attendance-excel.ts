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
  Notes: string;
}

const outputDir = path.join(process.cwd(), "pointages_EMP-001_2025_2026");

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

async function generateAttendanceFiles(): Promise<void> {
  fs.mkdirSync(outputDir, { recursive: true });
  let totalFiles = 0;

  for (const month of months) {
    const rows: AttendanceExportRow[] = [];
    const daysInMonth = new Date(month.year, month.month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(month.year, month.month - 1, day);
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      rows.push({
        Matricule: "EMP-001",
        "Nom & Prénoms": "Kouassi Jean",
        Date: `${month.year}-${String(month.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        "Heure Entree": "08:00",
        "Heure Sortie": "17:00",
        Statut: "Présent",
        "Heures Supp (minutes)": 0,
        Notes: "Présence effectuée (8h)",
      });
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
      { header: "Notes", key: "Notes", width: 25 },
    ];
    rows.forEach((row) => worksheet.addRow(row));

    const filePath = path.join(outputDir, `pointages_EMP-001_${month.name}.xlsx`);
    await workbook.xlsx.writeFile(filePath);
    totalFiles += 1;
  }

  console.log(`✅ ${totalFiles} fichiers Excel de pointage générés dans le dossier : ${outputDir}`);
}

generateAttendanceFiles().catch((error: unknown) => {
  console.error("Échec de génération des pointages EMP-001 :", error);
  process.exitCode = 1;
});
